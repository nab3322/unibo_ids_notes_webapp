package com.unibo.notes.dto;

import java.time.LocalDateTime;

public class ConflictDTO {
    public Long noteId;
    public String noteTitle;
    public Long currentVersion;
    public Long attemptedVersion;
    public String currentContent;
    public String attemptedContent;
    public String lastModifiedBy;
    public LocalDateTime lastModifiedAt;
    public String conflictType; // "VERSION_MISMATCH" or "CONCURRENT_EDIT"
}