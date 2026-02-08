package com.unibo.notes.service;

import com.unibo.notes.dto.PermissionDTO;
import com.unibo.notes.dto.ShareNoteRequest;
import com.unibo.notes.entity.Note;
import com.unibo.notes.entity.NotePermission;
import com.unibo.notes.entity.NotePermission.PermissionType;
import com.unibo.notes.entity.User;
import com.unibo.notes.exception.ConflictException;
import com.unibo.notes.exception.ResourceNotFoundException;
import com.unibo.notes.exception.UnauthorizedException;
import com.unibo.notes.exception.ValidationException;
import com.unibo.notes.repository.NotePermissionRepository;
import com.unibo.notes.repository.NoteRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class PermissionService {

    @Inject
    NotePermissionRepository permissionRepository;

    @Inject
    NoteRepository noteRepository;

    @Inject
    UserService userService;

    public boolean hasReadPermission(Long noteId, Long userId) {
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        // Il proprietario ha sempre permessi
        if (note.owner.id.equals(userId)) {
            return true;
        }

        // Controlla se ha permessi espliciti
        return permissionRepository.hasPermission(noteId, userId, PermissionType.READ);
    }

    public boolean hasWritePermission(Long noteId, Long userId) {
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        // Il proprietario ha sempre permessi
        if (note.owner.id.equals(userId)) {
            return true;
        }

        // Controlla se ha permessi di scrittura
        return permissionRepository.hasPermission(noteId, userId, PermissionType.WRITE);
    }

    @Transactional
    public PermissionDTO shareNote(Long noteId, ShareNoteRequest request, Long ownerId) {
        // Validazione
        if (request.username == null || request.username.trim().isEmpty()) {
            throw new ValidationException("Username is required");
        }
        if (request.permission == null ||
                (!request.permission.equals("READ") && !request.permission.equals("WRITE"))) {
            throw new ValidationException("Permission must be READ or WRITE");
        }

        // Verifica che la nota esista e che l'utente sia il proprietario
        Note note = noteRepository.findByIdAndOwner(noteId, ownerId)
                .orElseThrow(() -> new UnauthorizedException("Only the owner can share this note"));

        // Trova l'utente con cui condividere
        User targetUser = userService.findByUsername(request.username);

        // Non puoi condividere con te stesso
        if (targetUser.id.equals(ownerId)) {
            throw new ValidationException("Cannot share note with yourself");
        }

        // Controlla se già esiste un permesso
        var existingPermission = permissionRepository.findByNoteIdAndUserId(noteId, targetUser.id);
        if (existingPermission.isPresent()) {
            // Aggiorna permesso esistente
            NotePermission permission = existingPermission.get();
            permission.permission = PermissionType.valueOf(request.permission);
            permissionRepository.persist(permission);
            return toDTO(permission);
        }

        // Crea nuovo permesso
        NotePermission permission = new NotePermission();
        permission.note = note;
        permission.user = targetUser;
        permission.permission = PermissionType.valueOf(request.permission);

        permissionRepository.persist(permission);
        return toDTO(permission);
    }

    @Transactional
    public void revokePermission(Long noteId, Long targetUserId, Long ownerId) {
        // Verifica che la nota appartenga all'owner
        Note note = noteRepository.findByIdAndOwner(noteId, ownerId)
                .orElseThrow(() -> new UnauthorizedException("Only the owner can revoke permissions"));

        permissionRepository.deleteByNoteIdAndUserId(noteId, targetUserId);
    }

    @Transactional
    public PermissionDTO updatePermission(Long noteId, Long targetUserId, String newPermission, Long ownerId) {
        // Validazione permesso
        if (newPermission == null || (!newPermission.equals("READ") && !newPermission.equals("WRITE"))) {
            throw new ValidationException("Permission must be READ or WRITE");
        }

        // Verifica che la nota appartenga all'owner
        noteRepository.findByIdAndOwner(noteId, ownerId)
                .orElseThrow(() -> new UnauthorizedException("Only the owner can update permissions"));

        // Trova il permesso esistente
        NotePermission permission = permissionRepository.findByNoteIdAndUserId(noteId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "userId", targetUserId));

        // Aggiorna il permesso
        permission.permission = PermissionType.valueOf(newPermission);
        permissionRepository.persist(permission);

        return toDTO(permission);
    }

    public List<PermissionDTO> getNotePermissions(Long noteId, Long ownerId) {
        // Verifica che la nota appartenga all'owner
        noteRepository.findByIdAndOwner(noteId, ownerId)
                .orElseThrow(() -> new UnauthorizedException("Only the owner can view permissions"));

        return permissionRepository.findByNoteId(noteId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<Note> getSharedNotes(Long userId) {
        List<NotePermission> permissions = permissionRepository.findByUserIdWithNotes(userId);
        return permissions.stream()
                .map(p -> p.note)
                .collect(Collectors.toList());
    }

    @Transactional
    public void leaveNote(Long noteId, Long userId) {
        // Verifica che l'utente non sia il proprietario
        Note note = noteRepository.findByIdWithOwnerAndFolder(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        if (note.owner.id.equals(userId)) {
            throw new ValidationException("The owner cannot leave their own note");
        }

        // Verifica che l'utente abbia un permesso sulla nota
        var permission = permissionRepository.findByNoteIdAndUserId(noteId, userId);
        if (permission.isEmpty()) {
            throw new ResourceNotFoundException("Permission", "noteId/userId", noteId + "/" + userId);
        }

        // Rimuovi il permesso
        permissionRepository.deleteByNoteIdAndUserId(noteId, userId);
    }

    private PermissionDTO toDTO(NotePermission permission) {
        PermissionDTO dto = new PermissionDTO();
        dto.id = permission.id;
        dto.noteId = permission.note.id;
        dto.userId = permission.user.id;
        dto.username = permission.user.username;
        dto.permissionType = permission.permission.name();
        dto.grantedAt = permission.grantedAt;
        return dto;
    }
}