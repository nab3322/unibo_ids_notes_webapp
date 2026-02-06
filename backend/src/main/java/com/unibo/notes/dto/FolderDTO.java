package com.unibo.notes.dto;

import java.time.LocalDateTime;

public class FolderDTO {
    public Long id;
    public String name;
    public String description;
    public Long ownerId;
    public String ownerUsername;
    public Long parentId;
    public boolean isShared;
    public LocalDateTime createdAt;
    public long notesCount;
}
