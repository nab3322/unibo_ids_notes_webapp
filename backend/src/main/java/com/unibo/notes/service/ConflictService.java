package com.unibo.notes.service;

import com.unibo.notes.dto.ConflictDTO;
import com.unibo.notes.entity.Note;
import com.unibo.notes.entity.NoteVersion;
import com.unibo.notes.exception.ConflictException;
import com.unibo.notes.exception.ResourceNotFoundException;
import com.unibo.notes.exception.UnauthorizedException;
import com.unibo.notes.repository.NoteRepository;
import com.unibo.notes.repository.NoteVersionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@ApplicationScoped
public class ConflictService {

    @Inject
    NoteRepository noteRepository;

    @Inject
    NoteVersionRepository versionRepository;

    @Inject
    PermissionService permissionService;

    @Inject
    UserService userService;

    /**
     * Rileva se c'è un conflitto prima di salvare
     */
    public ConflictDTO detectConflict(Long noteId, Long expectedVersion, String newContent, Long userId) {
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        // Verifica permessi
        if (!note.owner.id.equals(userId) && !permissionService.hasWritePermission(noteId, userId)) {
            throw new UnauthorizedException("You don't have permission to edit this note");
        }

        // Nessun conflitto se le versioni coincidono
        if (note.version.equals(expectedVersion)) {
            return null;
        }

        // CONFLITTO RILEVATO!
        ConflictDTO conflict = new ConflictDTO();
        conflict.noteId = noteId;
        conflict.noteTitle = note.title;
        conflict.currentVersion = note.version;
        conflict.attemptedVersion = expectedVersion;
        conflict.currentContent = note.content;
        conflict.attemptedContent = newContent;
        conflict.lastModifiedAt = note.updatedAt;

        // Trova chi ha modificato per ultimo
        try {
            conflict.lastModifiedBy = userService.findById(note.lastModifiedBy).username;
        } catch (Exception e) {
            conflict.lastModifiedBy = "Unknown";
        }

        // Determina il tipo di conflitto
        conflict.conflictType = determineConflictType(note, expectedVersion);

        return conflict;
    }

    /**
     * Risolve un conflitto accettando una delle due versioni
     */
    @Transactional
    public Note resolveConflict(Long noteId, Long userId, String resolution, String resolvedContent) {
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        // Verifica permessi
        if (!note.owner.id.equals(userId) && !permissionService.hasWritePermission(noteId, userId)) {
            throw new UnauthorizedException("You don't have permission to resolve conflicts on this note");
        }

        switch (resolution.toUpperCase()) {
            case "ACCEPT_CURRENT":
                // Mantieni la versione corrente, non fare nulla
                break;

            case "ACCEPT_NEW":
                // Accetta la nuova versione
                if (resolvedContent == null || resolvedContent.trim().isEmpty()) {
                    throw new ConflictException("Resolved content is required");
                }
                if (resolvedContent.length() > 280) {
                    throw new ConflictException("Content must be less than 280 characters");
                }
                note.content = resolvedContent.trim();
                note.lastModifiedBy = userId;
                noteRepository.persist(note);

                // Salva nuova versione
                saveVersion(note, userId);
                break;

            case "MERGE":
                // Merge manuale - l'utente fornisce il contenuto merged
                if (resolvedContent == null || resolvedContent.trim().isEmpty()) {
                    throw new ConflictException("Merged content is required");
                }
                if (resolvedContent.length() > 280) {
                    throw new ConflictException("Content must be less than 280 characters");
                }
                note.content = resolvedContent.trim();
                note.lastModifiedBy = userId;
                noteRepository.persist(note);

                // Salva nuova versione
                saveVersion(note, userId);
                break;

            default:
                throw new ConflictException("Invalid resolution type. Use: ACCEPT_CURRENT, ACCEPT_NEW, or MERGE");
        }

        return note;
    }

    /**
     * Verifica se una nota è stata modificata di recente da un altro utente
     */
    public boolean isRecentlyModifiedByOther(Long noteId, Long userId, int minutesThreshold) {
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        // Se l'ultima modifica è dello stesso utente, non c'è conflitto potenziale
        if (note.lastModifiedBy.equals(userId)) {
            return false;
        }

        // Controlla se modificata negli ultimi N minuti
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(minutesThreshold);
        return note.updatedAt.isAfter(threshold);
    }

    /**
     * Ottiene info su potenziali conflitti attivi
     */
    public ConflictDTO checkForActiveConflict(Long noteId, Long userId) {
        // Controlla se la nota è stata modificata negli ultimi 5 minuti da qualcun altro
        if (isRecentlyModifiedByOther(noteId, userId, 5)) {
            Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

            ConflictDTO warning = new ConflictDTO();
            warning.noteId = noteId;
            warning.noteTitle = note.title;
            warning.currentVersion = note.version;
            warning.currentContent = note.content;
            warning.lastModifiedAt = note.updatedAt;
            warning.conflictType = "CONCURRENT_EDIT";

            try {
                warning.lastModifiedBy = userService.findById(note.lastModifiedBy).username;
            } catch (Exception e) {
                warning.lastModifiedBy = "Unknown";
            }

            return warning;
        }

        return null;
    }

    private String determineConflictType(Note note, Long attemptedVersion) {
        long versionDiff = note.version - attemptedVersion;

        if (versionDiff == 1) {
            // Solo una versione di differenza
            LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
            if (note.updatedAt.isAfter(fiveMinutesAgo)) {
                return "CONCURRENT_EDIT"; // Modifica quasi simultanea
            }
        }

        return "VERSION_MISMATCH"; // Versioni molto diverse
    }

    private void saveVersion(Note note, Long userId) {
        NoteVersion version = new NoteVersion();
        version.noteId = note.id;
        version.content = note.content;
        version.versionNumber = versionRepository.getNextVersionNumber(note.id);
        version.modifiedBy = userId;
        versionRepository.persist(version);
    }
}