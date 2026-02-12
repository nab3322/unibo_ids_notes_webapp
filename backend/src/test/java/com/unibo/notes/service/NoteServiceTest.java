package com.unibo.notes.service;

import com.unibo.notes.dto.CreateNoteRequest;
import com.unibo.notes.dto.UpdateNoteRequest;
import com.unibo.notes.entity.Note;
import com.unibo.notes.entity.User;
import com.unibo.notes.exception.ConflictException;
import com.unibo.notes.exception.ResourceNotFoundException;
import com.unibo.notes.exception.UnauthorizedException;
import com.unibo.notes.exception.ValidationException;
import com.unibo.notes.repository.FolderRepository;
import com.unibo.notes.repository.NoteRepository;
import com.unibo.notes.repository.UserRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@QuarkusTest
class NoteServiceTest {

    @Inject
    NoteService noteService;

    @Inject
    NoteRepository noteRepository;

    @Inject
    FolderRepository folderRepository;  // ✅ SPOSTATO DENTRO

    @Inject
    UserRepository userRepository;

    private User testUser;
    private User otherUser;

    @BeforeEach
    @Transactional
    void setup() {
        // Pulisci database nell'ordine corretto
        noteRepository.deleteAll();
        folderRepository.deleteAll();
        userRepository.deleteAll();

        // Crea utenti di test
        testUser = new User();
        testUser.username = "testuser";
        testUser.email = "test@example.com";
        testUser.passwordHash = "hash";
        userRepository.persist(testUser);

        otherUser = new User();
        otherUser.username = "otheruser";
        otherUser.email = "other@example.com";
        otherUser.passwordHash = "hash";
        userRepository.persist(otherUser);
    }

    @Test
    @Transactional
    void shouldCreateNote() {
        CreateNoteRequest request = new CreateNoteRequest();
        request.title = "Test Note";
        request.content = "This is a test note";

        Note note = noteService.createNote(request, testUser.id);

        assertThat(note).isNotNull();
        assertThat(note.id).isNotNull();
        assertThat(note.title).isEqualTo("Test Note");
        assertThat(note.content).isEqualTo("This is a test note");
        assertThat(note.owner.id).isEqualTo(testUser.id);
    }

    @Test
    @Transactional
    void shouldThrowExceptionWhenCreatingNoteWithEmptyTitle() {
        CreateNoteRequest request = new CreateNoteRequest();
        request.title = "";
        request.content = "Content";

        assertThatThrownBy(() -> noteService.createNote(request, testUser.id))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Title is required");
    }

    @Test
    @Transactional
    void shouldThrowExceptionWhenCreatingNoteWithLongContent() {
        CreateNoteRequest request = new CreateNoteRequest();
        request.title = "Title";
        request.content = "a".repeat(281); // 281 caratteri

        assertThatThrownBy(() -> noteService.createNote(request, testUser.id))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("280 characters");
    }

    @Test
    @Transactional
    void shouldGetAllNotesByUser() {
        CreateNoteRequest request1 = new CreateNoteRequest();
        request1.title = "Note 1";
        request1.content = "Content 1";
        noteService.createNote(request1, testUser.id);

        CreateNoteRequest request2 = new CreateNoteRequest();
        request2.title = "Note 2";
        request2.content = "Content 2";
        noteService.createNote(request2, testUser.id);

        List<Note> notes = noteService.getAllNotesByUser(testUser.id);

        assertThat(notes).hasSize(2);
    }

    @Test
    @Transactional
    void shouldGetNoteById() {
        CreateNoteRequest request = new CreateNoteRequest();
        request.title = "Test";
        request.content = "Content";
        Note created = noteService.createNote(request, testUser.id);

        Note found = noteService.getNoteById(created.id, testUser.id);

        assertThat(found).isNotNull();
        assertThat(found.title).isEqualTo("Test");
    }

    @Test
    @Transactional
    void shouldThrowExceptionWhenNoteNotFound() {
        assertThatThrownBy(() -> noteService.getNoteById(999L, testUser.id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @Transactional
    void shouldUpdateNote() {
        CreateNoteRequest createRequest = new CreateNoteRequest();
        createRequest.title = "Original";
        createRequest.content = "Original content";
        Note note = noteService.createNote(createRequest, testUser.id);

        UpdateNoteRequest updateRequest = new UpdateNoteRequest();
        updateRequest.title = "Updated";
        updateRequest.content = "Updated content";

        Note updated = noteService.updateNote(note.id, updateRequest, testUser.id);

        assertThat(updated.title).isEqualTo("Updated");
        assertThat(updated.content).isEqualTo("Updated content");
    }

    @Test
    @Transactional
    void shouldThrowConflictExceptionWhenVersionMismatch() {
        CreateNoteRequest createRequest = new CreateNoteRequest();
        createRequest.title = "Note";
        createRequest.content = "Content";
        Note note = noteService.createNote(createRequest, testUser.id);

        UpdateNoteRequest updateRequest = new UpdateNoteRequest();
        updateRequest.content = "New content";
        updateRequest.expectedVersion = 999L; // Versione sbagliata

        assertThatThrownBy(() -> noteService.updateNote(note.id, updateRequest, testUser.id))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("modified by another user");
    }

    @Test
    @Transactional
    void shouldDeleteNote() {
        CreateNoteRequest request = new CreateNoteRequest();
        request.title = "To Delete";
        request.content = "Content";
        Note note = noteService.createNote(request, testUser.id);

        noteService.deleteNote(note.id, testUser.id);

        assertThatThrownBy(() -> noteService.getNoteById(note.id, testUser.id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @Transactional
    void shouldThrowExceptionWhenNonOwnerTriesToDelete() {
        CreateNoteRequest request = new CreateNoteRequest();
        request.title = "Owner's Note";
        request.content = "Content";
        Note note = noteService.createNote(request, testUser.id);

        assertThatThrownBy(() -> noteService.deleteNote(note.id, otherUser.id))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("owner");
    }

    @Test
    @Transactional
    void shouldCopyNote() {
        CreateNoteRequest request = new CreateNoteRequest();
        request.title = "Original";
        request.content = "Original content";
        Note original = noteService.createNote(request, testUser.id);

        Note copy = noteService.copyNote(original.id, testUser.id);

        assertThat(copy).isNotNull();
        assertThat(copy.id).isNotEqualTo(original.id);
        assertThat(copy.title).contains("Copia");
        assertThat(copy.content).isEqualTo(original.content);
    }

    @Test
    @Transactional
    void shouldSearchNotes() {
        CreateNoteRequest request1 = new CreateNoteRequest();
        request1.title = "Java Tutorial";
        request1.content = "Learning Java";
        noteService.createNote(request1, testUser.id);

        CreateNoteRequest request2 = new CreateNoteRequest();
        request2.title = "Python Guide";
        request2.content = "Learning Python";
        noteService.createNote(request2, testUser.id);

        List<Note> javaResults = noteService.searchNotes("Java", testUser.id);

        assertThat(javaResults).hasSize(1);
        assertThat(javaResults.get(0).title).contains("Java");
    }
}
