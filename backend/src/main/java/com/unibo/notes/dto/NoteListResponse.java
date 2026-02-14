package com.unibo.notes.dto;

import java.util.List;

/**
 * Risposta paginata per la lista delle note.
 * Compatibile con il frontend Angular.
 */
public class NoteListResponse {
    public List<NoteDTO> notes;
    public int total;
    public int page;
    public int limit;

    public NoteListResponse(List<NoteDTO> notes) {
        this.notes = notes;
        this.total = notes != null ? notes.size() : 0;
        this.page = 1;
        this.limit = this.total;
    }

    public NoteListResponse(List<NoteDTO> notes, int page, int limit, int total) {
        this.notes = notes;
        this.total = total;
        this.page = page;
        this.limit = limit;
    }
}
