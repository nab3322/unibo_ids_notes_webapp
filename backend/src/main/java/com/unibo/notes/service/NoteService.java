package com.unibo.notes.service;

import com.unibo.notes.entity.User;
import com.unibo.notes.dto.CreateNoteRequest;
import com.unibo.notes.dto.UpdateNoteRequest;
import com.unibo.notes.entity.Folder;
import com.unibo.notes.entity.Note;
import com.unibo.notes.entity.NoteVersion;
import com.unibo.notes.exception.ConflictException;
import com.unibo.notes.exception.ResourceNotFoundException;
import com.unibo.notes.exception.UnauthorizedException;
import com.unibo.notes.exception.ValidationException;
import com.unibo.notes.repository.FolderRepository;
import com.unibo.notes.repository.NoteRepository;
import com.unibo.notes.repository.NoteVersionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import com.unibo.notes.dto.NoteStatsDTO;
import java.time.LocalDateTime;
import java.util.Collections; // Import necessario per getAllTags
import java.util.List;

@ApplicationScoped
public class NoteService {

    @Inject
    NoteRepository noteRepository;

    @Inject
    FolderRepository folderRepository;

    @Inject
    NoteVersionRepository versionRepository;

    @Inject
    UserService userService;

    @Inject
    PermissionService permissionService;

    public List<Note> getAllNotesByUser(Long userId) {
        return noteRepository.findByOwnerId(userId);
    }

    public List<Note> getNotesByFolder(Long folderId, Long userId) {
        // Verifica che la cartella appartenga all'utente
        Folder folder = folderRepository.findByIdAndOwner(folderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", folderId));

        return noteRepository.list("folder.id = ?1 and owner.id = ?2", folderId, userId);
    }

    public Note getNoteById(Long noteId, Long userId) {
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        // Verifica permessi: proprietario o ha permessi di lettura
        if (!note.owner.id.equals(userId) && !permissionService.hasReadPermission(noteId, userId)) {
            throw new UnauthorizedException("You don't have permission to access this note");
        }

        return note;
    }

    @Transactional
    public Note createNote(CreateNoteRequest request, Long userId) {
        // Validazione
        if (request.title == null || request.title.trim().isEmpty()) {
            throw new ValidationException("Title is required");
        }
        if (request.content == null || request.content.trim().isEmpty()) {
            throw new ValidationException("Content is required");
        }
        if (request.content.length() > 280) {
            throw new ValidationException("Content must be less than 280 characters");
        }

        // Crea nota
        Note note = new Note();
        note.title = request.title.trim();
        note.content = request.content.trim();
        note.owner = userService.findById(userId);
        note.lastModifiedBy = userId;

        // Gestione cartella
        if (request.folderId != null) {
            Folder folder = folderRepository.findByIdAndOwner(request.folderId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", request.folderId));
            note.folder = folder;
        }

        noteRepository.persist(note);

        // Crea prima versione
        saveVersion(note, userId);

        return note;
    }

    @Transactional
    public Note updateNote(Long noteId, UpdateNoteRequest request, Long userId) {
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        // Verifica permessi: proprietario o ha permessi di scrittura
        if (!note.owner.id.equals(userId) && !permissionService.hasWritePermission(noteId, userId)) {
            throw new UnauthorizedException("You don't have permission to edit this note");
        }

        // Gestione conflitti ottimistici
        if (request.expectedVersion != null && !note.version.equals(request.expectedVersion)) {
            throw new ConflictException("Note has been modified by another user. Current version: " + note.version);
        }

        // Aggiorna campi
        if (request.title != null && !request.title.trim().isEmpty()) {
            note.title = request.title.trim();
        }
        if (request.content != null) {
            if (request.content.length() > 280) {
                throw new ValidationException("Content must be less than 280 characters");
            }
            note.content = request.content.trim();
        }

        // Gestione cartella (solo il proprietario può cambiare cartella)
        if (note.owner.id.equals(userId)) {
            if (request.folderId != null) {
                Folder folder = folderRepository.findByIdAndOwner(request.folderId, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", request.folderId));
                note.folder = folder;
            } else {
                note.folder = null; // Rimuovi dalla cartella se folderId è null
            }
        }

        note.lastModifiedBy = userId;
        noteRepository.persist(note);

        // Salva nuova versione
        saveVersion(note, userId);

        return note;
    }

    @Transactional
    public void deleteNote(Long noteId, Long userId) {
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        // Solo il proprietario può eliminare
        if (!note.owner.id.equals(userId)) {
            throw new UnauthorizedException("Only the owner can delete this note");
        }

        noteRepository.delete(note);
    }

    @Transactional
    public Note moveNoteToFolder(Long noteId, Long folderId, Long userId) {
        Note note = getNoteById(noteId, userId);

        // Verifica che sia il proprietario
        if (!note.owner.id.equals(userId)) {
            throw new UnauthorizedException("Only the owner can move this note");
        }

        if (folderId != null) {
            Folder folder = folderRepository.findByIdAndOwner(folderId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", folderId));
            note.folder = folder;
        } else {
            note.folder = null; // Rimuovi dalla cartella
        }

        noteRepository.persist(note);
        return note;
    }

    @Transactional
    public Note copyNote(Long noteId, Long userId) {
        // Recupera la nota originale e verifica permessi
        Note original = getNoteById(noteId, userId);

        // Recupera l'utente proprietario della copia
        var owner = userService.findById(userId);
        if (owner == null) {
            throw new ResourceNotFoundException("User", "id", userId);
        }

        // Crea la copia della nota
        Note copy = new Note();
        copy.title = original.title + " (Copia)";
        copy.content = original.content;
        copy.owner = owner;          // assegna l’utente corretto
        copy.folder = original.folder; // mantiene la cartella, se presente
        copy.lastModifiedBy = userId;

        // Persiste la copia e forza l’assegnazione dell’ID
        noteRepository.persistAndFlush(copy);

        // Salva la prima versione della copia
        saveVersion(copy, userId);

        return copy;
    }

    public List<Note> searchNotes(String keyword, Long userId) {
        return noteRepository.searchByContent(keyword, userId);
    }

    public List<Note> advancedSearch(Long userId, String keyword, String author,
                                      Long folderId, LocalDateTime createdFrom,
                                      LocalDateTime createdTo, LocalDateTime modifiedFrom,
                                      LocalDateTime modifiedTo, boolean includeShared) {
        return noteRepository.advancedSearch(userId, keyword, author, folderId,
                createdFrom, createdTo, modifiedFrom, modifiedTo, includeShared);
    }

    private void saveVersion(Note note, Long userId) {
        NoteVersion version = new NoteVersion();
        version.noteId = note.id;
        version.content = note.content;
        version.versionNumber = versionRepository.getNextVersionNumber(note.id);
        version.modifiedBy = userId;

        versionRepository.persist(version);
    }

    @Transactional
    public NoteStatsDTO getStatistics(Long userId) {
        try {
            // Usa la sintassi esplicita: conta le note dove owner.id è uguale a userId
            long count = noteRepository.count("owner.id = ?1", userId);

            // Conta le note condivise con l'utente
            long sharedCount = permissionService.getSharedNotes(userId).size();

            // Log di debug (utile se controlli i log del backend)
            System.out.println("Stats request for user " + userId + ": found " + count + " notes, " + sharedCount + " shared");

            // Restituiamo il DTO con il conteggio delle note condivise
            return new NoteStatsDTO(count, 0, sharedCount);
        } catch (Exception e) {
            // Stampa l'errore reale nel terminale del backend per debugging
            e.printStackTrace();
            throw e; // Rilancia l'errore per farlo gestire a Quarkus (darà comunque 500 ma sapremo perché)
        }
    }

    public List<String> getAllTags(Long userId) {
        // Restituisce lista vuota per evitare 404/500 sulla dashboard
        return Collections.emptyList();
    }
}