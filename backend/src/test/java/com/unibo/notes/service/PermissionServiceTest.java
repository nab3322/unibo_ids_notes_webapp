package com.unibo.notes.service;

import com.unibo.notes.dto.CreateNoteRequest;
import com.unibo.notes.dto.PermissionDTO;
import com.unibo.notes.dto.ShareNoteRequest;
import com.unibo.notes.entity.Note;
import com.unibo.notes.entity.User;
import com.unibo.notes.exception.ConflictException;
import com.unibo.notes.exception.UnauthorizedException;
import com.unibo.notes.exception.ValidationException;
import com.unibo.notes.repository.NotePermissionRepository;
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
class PermissionServiceTest {

    @Inject
    PermissionService permissionService;

    @Inject
    NoteService noteService;

    @Inject
    NoteRepository noteRepository;

    @Inject
    NotePermissionRepository permissionRepository;

    @Inject
    UserRepository userRepository;

    private User owner;
    private User sharedUser;
    private Note testNote;

    @BeforeEach
    @Transactional
    void setup() {
        // Pulisci database
        permissionRepository.deleteAll();
        noteRepository.deleteAll();
        userRepository.deleteAll();

        // Crea utenti
        owner = new User();
        owner.username = "owner";
        owner.email = "owner@example.com";
        owner.passwordHash = "hash";
        userRepository.persist(owner);

        sharedUser = new User();
        sharedUser.username = "shared";
        sharedUser.email = "shared@example.com";
        sharedUser.passwordHash = "hash";
        userRepository.persist(sharedUser);

        // Crea nota
        CreateNoteRequest request = new CreateNoteRequest();
        request.title = "Shared Note";
        request.content = "This note will be shared";
        testNote = noteService.createNote(request, owner.id);
    }

    @Test
    @Transactional
    void ownerShouldHaveReadPermission() {
        boolean hasRead = permissionService.hasReadPermission(testNote.id, owner.id);

        assertThat(hasRead).isTrue();
    }

    @Test
    @Transactional
    void ownerShouldHaveWritePermission() {
        boolean hasWrite = permissionService.hasWritePermission(testNote.id, owner.id);

        assertThat(hasWrite).isTrue();
    }

    @Test
    @Transactional
    void shouldShareNoteWithReadPermission() {
        ShareNoteRequest request = new ShareNoteRequest();
        request.username = "shared";
        request.permission = "READ";

        PermissionDTO permission = permissionService.shareNote(testNote.id, request, owner.id);

        assertThat(permission).isNotNull();
        assertThat(permission.username).isEqualTo("shared");
        assertThat(permission.permissionType).isEqualTo("READ");
    }

    @Test
    @Transactional
    void shouldShareNoteWithWritePermission() {
        ShareNoteRequest request = new ShareNoteRequest();
        request.username = "shared";
        request.permission = "WRITE";

        PermissionDTO permission = permissionService.shareNote(testNote.id, request, owner.id);

        assertThat(permission.permissionType).isEqualTo("WRITE");
    }

    @Test
    @Transactional
    void shouldThrowExceptionWhenSharingWithInvalidPermission() {
        ShareNoteRequest request = new ShareNoteRequest();
        request.username = "shared";
        request.permission = "INVALID";

        assertThatThrownBy(() -> permissionService.shareNote(testNote.id, request, owner.id))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("READ or WRITE");
    }

    @Test
    @Transactional
    void shouldThrowExceptionWhenSharingWithSelf() {
        ShareNoteRequest request = new ShareNoteRequest();
        request.username = "owner";
        request.permission = "READ";

        assertThatThrownBy(() -> permissionService.shareNote(testNote.id, request, owner.id))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("yourself");
    }

    @Test
    @Transactional
    void shouldThrowExceptionWhenNonOwnerTriesToShare() {
        ShareNoteRequest request = new ShareNoteRequest();
        request.username = "shared";
        request.permission = "READ";

        assertThatThrownBy(() -> permissionService.shareNote(testNote.id, request, sharedUser.id))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("owner");
    }

    @Test
    @Transactional
    void shouldUpdateExistingPermission() {
        // Prima condividi con READ
        ShareNoteRequest request1 = new ShareNoteRequest();
        request1.username = "shared";
        request1.permission = "READ";
        permissionService.shareNote(testNote.id, request1, owner.id);

        // Poi aggiorna a WRITE
        ShareNoteRequest request2 = new ShareNoteRequest();
        request2.username = "shared";
        request2.permission = "WRITE";
        PermissionDTO updated = permissionService.shareNote(testNote.id, request2, owner.id);

        assertThat(updated.permissionType).isEqualTo("WRITE");
    }

    @Test
    @Transactional
    void sharedUserShouldHaveReadPermissionAfterSharing() {
        ShareNoteRequest request = new ShareNoteRequest();
        request.username = "shared";
        request.permission = "READ";
        permissionService.shareNote(testNote.id, request, owner.id);

        boolean hasRead = permissionService.hasReadPermission(testNote.id, sharedUser.id);

        assertThat(hasRead).isTrue();
    }

    @Test
    @Transactional
    void shouldGetNotePermissions() {
        ShareNoteRequest request = new ShareNoteRequest();
        request.username = "shared";
        request.permission = "READ";
        permissionService.shareNote(testNote.id, request, owner.id);

        List<PermissionDTO> permissions = permissionService.getNotePermissions(testNote.id, owner.id);

        assertThat(permissions).hasSize(1);
        assertThat(permissions.get(0).username).isEqualTo("shared");
    }

    @Test
    @Transactional
    void shouldRevokePermission() {
        ShareNoteRequest request = new ShareNoteRequest();
        request.username = "shared";
        request.permission = "READ";
        permissionService.shareNote(testNote.id, request, owner.id);

        permissionService.revokePermission(testNote.id, sharedUser.id, owner.id);

        boolean hasRead = permissionService.hasReadPermission(testNote.id, sharedUser.id);
        assertThat(hasRead).isFalse();
    }

    @Test
    @Transactional
    void shouldGetSharedNotes() {
        ShareNoteRequest request = new ShareNoteRequest();
        request.username = "shared";
        request.permission = "READ";
        permissionService.shareNote(testNote.id, request, owner.id);

        List<Note> sharedNotes = permissionService.getSharedNotes(sharedUser.id);

        assertThat(sharedNotes).hasSize(1);
        assertThat(sharedNotes.get(0).id).isEqualTo(testNote.id);
    }
}