package com.unibo.notes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ShareNoteRequest {

    @NotBlank(message = "Username is required")
    public String username;

    @NotNull(message = "Permission is required")
    public String permission; // "READ" or "WRITE"
}