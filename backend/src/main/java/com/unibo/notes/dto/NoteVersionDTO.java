package com.unibo.notes.dto;

import java.time.LocalDateTime;

public class NoteVersionDTO {
    public Long id;
    public Long noteId;
    public String content;
    public Long versionNumber;
    public String modifiedByUsername;
    public LocalDateTime modifiedAt;
}