package com.unibo.notes.dto;

import jakarta.validation.constraints.Size;
import java.util.List;

public class UpdateNoteRequest {

    @Size(max = 100, message = "Title must be less than 100 characters")
    public String title;

    @Size(max = 280, message = "Content must be less than 280 characters")
    public String content;

    public List<String> tags;

    public Long folderId;

    public Long expectedVersion; // Per gestione conflitti ottimistica
}