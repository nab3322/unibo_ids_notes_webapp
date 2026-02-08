package com.unibo.notes.dto;

import java.time.LocalDateTime;

public class PermissionDTO {
    public Long id;
    public Long noteId;
    public Long userId;
    public String username;
    public String permissionType; // "READ" or "WRITE"
    public LocalDateTime grantedAt;
}