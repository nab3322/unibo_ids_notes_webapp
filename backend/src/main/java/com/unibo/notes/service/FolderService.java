package com.unibo.notes.service;

import com.unibo.notes.entity.Folder;
import com.unibo.notes.entity.User;
import com.unibo.notes.exception.ConflictException;
import com.unibo.notes.exception.ResourceNotFoundException;
import com.unibo.notes.exception.ValidationException;
import com.unibo.notes.repository.FolderRepository;
import com.unibo.notes.repository.NoteRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class FolderService {

    @Inject
    FolderRepository folderRepository;

    @Inject
    NoteRepository noteRepository;

    @Inject
    UserService userService;

    public List<Folder> getRootFolders(Long userId) {
        return folderRepository.findRootFoldersByOwnerId(userId);
    }

    public List<Folder> getSubfolders(Long parentId, Long userId) {
        // Verifica che parent esista e appartenga all'utente
        Folder parent = folderRepository.findByIdAndOwner(parentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", parentId));

        return folderRepository.findSubfolders(parentId);
    }

    public Folder getFolderById(Long folderId, Long userId) {
        return folderRepository.findByIdWithOwner(folderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", folderId));
    }

    @Transactional
    public Folder createFolder(String name, String description, Long parentId, Long userId) {
        // Validazione
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Folder name is required");
        }
        if (name.length() > 100) {
            throw new ValidationException("Folder name must be less than 100 characters");
        }

        // Verifica duplicati
        if (folderRepository.existsByNameAndOwner(name, userId)) {
            throw new ConflictException("A folder with this name already exists");
        }

        // Crea cartella
        Folder folder = new Folder();
        folder.name = name.trim();
        folder.description = description;
        folder.owner = userService.findById(userId);
        folder.isShared = false;

        // Se ha un parent, verifica che esista e appartenga all'utente
        if (parentId != null) {
            Folder parent = folderRepository.findByIdAndOwner(parentId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent folder", "id", parentId));
            folder.parent = parent;
        }

        folderRepository.persist(folder);
        return folder;
    }

    @Transactional
    public Folder updateFolder(Long folderId, String name, String description, Long userId) {
        Folder folder = getFolderById(folderId, userId);

        if (name != null && !name.trim().isEmpty()) {
            if (!name.equals(folder.name) && folderRepository.existsByNameAndOwner(name, userId)) {
                throw new ConflictException("A folder with this name already exists");
            }
            folder.name = name.trim();
        }

        if (description != null) {
            folder.description = description;
        }

        folderRepository.persist(folder);
        return folder;
    }

    @Transactional
    public void deleteFolder(Long folderId, Long userId) {
        Folder folder = getFolderById(folderId, userId);

        // Verifica che non ci siano note dentro
        long notesCount = folderRepository.countNotesByFolder(folderId);
        if (notesCount > 0) {
            throw new ConflictException("Cannot delete folder with notes. Move or delete notes first.");
        }

        // Verifica che non ci siano sottocartelle
        if (!folder.subfolders.isEmpty()) {
            throw new ConflictException("Cannot delete folder with subfolders. Delete subfolders first.");
        }

        folderRepository.delete(folder);
    }

    public long countNotesByFolder(Long folderId, Long userId) {
        // Verifica che l'utente abbia accesso alla cartella
        getFolderById(folderId, userId);

        // Conta solo le note dell'utente in questa cartella
        return noteRepository.count("folder.id = ?1 and owner.id = ?2", folderId, userId);
    }
}