package com.unibo.notes.service;

import com.unibo.notes.dto.NoteVersionDTO;
import com.unibo.notes.entity.Note;
import com.unibo.notes.entity.NoteVersion;
import com.unibo.notes.exception.ResourceNotFoundException;
import com.unibo.notes.exception.UnauthorizedException;
import com.unibo.notes.repository.NoteRepository;
import com.unibo.notes.repository.NoteVersionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class VersionService {

    @Inject
    NoteVersionRepository versionRepository;

    @Inject
    NoteRepository noteRepository;

    @Inject
    PermissionService permissionService;

    @Inject
    UserService userService;

    public List<NoteVersionDTO> getNoteVersions(Long noteId, Long userId) {
        // Verifica che l'utente abbia accesso alla nota
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        if (!note.owner.id.equals(userId) && !permissionService.hasReadPermission(noteId, userId)) {
            throw new UnauthorizedException("You don't have permission to view versions of this note");
        }

        List<NoteVersion> versions = versionRepository.findByNoteId(noteId);
        return versions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public NoteVersionDTO getSpecificVersion(Long noteId, Long versionNumber, Long userId) {
        // Verifica permessi
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        if (!note.owner.id.equals(userId) && !permissionService.hasReadPermission(noteId, userId)) {
            throw new UnauthorizedException("You don't have permission to view this note");
        }

        NoteVersion version = versionRepository.findByNoteIdAndVersionNumber(noteId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Version " + versionNumber + " not found for note " + noteId));

        return toDTO(version);
    }

    @Transactional
    public Note restoreVersion(Long noteId, Long versionNumber, Long userId) {
        // Verifica che l'utente abbia permessi di scrittura
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        if (!note.owner.id.equals(userId) && !permissionService.hasWritePermission(noteId, userId)) {
            throw new UnauthorizedException("You don't have permission to restore versions of this note");
        }

        // Trova la versione da ripristinare
        NoteVersion versionToRestore = versionRepository.findByNoteIdAndVersionNumber(noteId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Version " + versionNumber + " not found"));

        // Ripristina il contenuto
        note.content = versionToRestore.content;
        note.lastModifiedBy = userId;
        noteRepository.persist(note);

        // Crea una nuova versione per il ripristino
        NoteVersion newVersion = new NoteVersion();
        newVersion.noteId = note.id;
        newVersion.content = note.content;
        newVersion.versionNumber = versionRepository.getNextVersionNumber(note.id);
        newVersion.modifiedBy = userId;
        versionRepository.persist(newVersion);

        return note;
    }

    @Transactional
    public void deleteOldVersions(Long noteId, int keepLast, Long userId) {
        // Solo il proprietario può eliminare versioni
        Note note = noteRepository.findByIdAndOwner(noteId, userId)
                .orElseThrow(() -> new UnauthorizedException("Only the owner can delete versions"));

        versionRepository.deleteOldVersions(noteId, keepLast);
    }

    public long getVersionCount(Long noteId, Long userId) {
        // Verifica permessi
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        if (!note.owner.id.equals(userId) && !permissionService.hasReadPermission(noteId, userId)) {
            throw new UnauthorizedException("You don't have permission to view this note");
        }

        return versionRepository.countByNoteId(noteId);
    }

    private NoteVersionDTO toDTO(NoteVersion version) {
        NoteVersionDTO dto = new NoteVersionDTO();
        dto.id = version.id;
        dto.noteId = version.noteId;
        dto.content = version.content;
        dto.versionNumber = version.versionNumber;
        dto.modifiedAt = version.modifiedAt;

        // Trova username di chi ha modificato
        try {
            dto.modifiedByUsername = userService.findById(version.modifiedBy).username;
        } catch (Exception e) {
            dto.modifiedByUsername = "Unknown";
        }

        return dto;
    }
}