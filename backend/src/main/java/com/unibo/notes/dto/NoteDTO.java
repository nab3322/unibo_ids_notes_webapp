package com.unibo.notes.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class NoteDTO {
    public Long id;
    public String title;
    public String content;
    public Long ownerId;
    public String ownerUsername;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    // Alias per compatibilità con frontend
    public LocalDateTime modifiedAt;

    public Long version;
    // Alias per compatibilità con frontend
    public Long versionNumber;

    public Long folderId;
    public String folderName;

    // Campi richiesti dal frontend
    public List<String> tags = new ArrayList<>();
    public boolean isShared = false;
    public boolean canEdit = true;
    public boolean canDelete = true;

    public List<CollaboratorDTO> collaborators;

    /**
     * Imposta entrambi updatedAt e modifiedAt per compatibilità
     */
    public void setUpdatedAt(LocalDateTime datetime) {
        this.updatedAt = datetime;
        this.modifiedAt = datetime;
    }

    /**
     * Imposta entrambi version e versionNumber per compatibilità
     */
    public void setVersion(Long ver) {
        this.version = ver;
        this.versionNumber = ver;
    }

    public static class CollaboratorDTO {
        public Long userId;
        public String username;
        public String permission; // "READ" or "WRITE"
    }
}
