package com.unibo.notes.dto;

public class NoteStatsDTO {
    // Rendiamo i campi privati e usiamo i getter/setter
    private long totalNotes;
    private long totalTags;
    private long sharedWithMe;

    public NoteStatsDTO() {}

    public NoteStatsDTO(long totalNotes, long totalTags) {
        this.totalNotes = totalNotes;
        this.totalTags = totalTags;
        this.sharedWithMe = 0;
    }

    public NoteStatsDTO(long totalNotes, long totalTags, long sharedWithMe) {
        this.totalNotes = totalNotes;
        this.totalTags = totalTags;
        this.sharedWithMe = sharedWithMe;
    }

    // GETTERS & SETTERS (Fondamentali per evitare errori 500 durante la serializzazione JSON)
    public long getTotalNotes() {
        return totalNotes;
    }

    public void setTotalNotes(long totalNotes) {
        this.totalNotes = totalNotes;
    }

    public long getTotalTags() {
        return totalTags;
    }

    public void setTotalTags(long totalTags) {
        this.totalTags = totalTags;
    }

    public long getSharedWithMe() {
        return sharedWithMe;
    }

    public void setSharedWithMe(long sharedWithMe) {
        this.sharedWithMe = sharedWithMe;
    }
}