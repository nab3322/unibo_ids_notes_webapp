package com.unibo.notes.controller;

import io.quarkus.security.Authenticated;
import com.unibo.notes.entity.Note;
import com.unibo.notes.service.NoteService;
import com.unibo.notes.service.PermissionService;
import io.smallrye.jwt.auth.principal.JWTCallerPrincipal;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Path("/api/search")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class SearchController {

    @Inject
    NoteService noteService;

    @Inject
    PermissionService permissionService;

    private Long getUserId(SecurityContext securityContext) {
        if (securityContext.getUserPrincipal() == null) {
            throw new SecurityException("No authentication token");
        }
        JWTCallerPrincipal principal = (JWTCallerPrincipal) securityContext.getUserPrincipal();
        return Long.parseLong(principal.getSubject());
    }

    @GET
    public Response search(
            @QueryParam("q") String query,
            @QueryParam("types") String types,
            @QueryParam("author") String author,
            @QueryParam("folderId") Long folderId,
            @QueryParam("createdFrom") String createdFrom,
            @QueryParam("createdTo") String createdTo,
            @QueryParam("modifiedFrom") String modifiedFrom,
            @QueryParam("modifiedTo") String modifiedTo,
            @QueryParam("includeShared") @DefaultValue("true") boolean includeShared,
            @QueryParam("includeArchived") @DefaultValue("false") boolean includeArchived,
            @QueryParam("sortBy") @DefaultValue("relevance") String sortBy,
            @QueryParam("sortOrder") @DefaultValue("desc") String sortOrder,
            @Context SecurityContext securityContext) {

        Long userId = getUserId(securityContext);
        long startTime = System.currentTimeMillis();

        // Parse date filters
        LocalDateTime createdFromDate = parseDateTime(createdFrom);
        LocalDateTime createdToDate = parseDateTime(createdTo);
        LocalDateTime modifiedFromDate = parseDateTime(modifiedFrom);
        LocalDateTime modifiedToDate = parseDateTime(modifiedTo);

        // Use advanced search with all filters
        List<Note> notes = noteService.advancedSearch(
            userId,
            query,
            author,
            folderId,
            createdFromDate,
            createdToDate,
            modifiedFromDate,
            modifiedToDate,
            includeShared
        );

        List<SearchResultDTO> results = new ArrayList<>();

        for (Note note : notes) {
            SearchResultDTO dto = new SearchResultDTO();
            dto.id = note.id.toString();
            dto.type = "note";
            dto.title = note.title;
            dto.excerpt = note.content != null && note.content.length() > 100
                ? note.content.substring(0, 100) + "..."
                : (note.content != null ? note.content : "");
            dto.relevanceScore = query != null && !query.trim().isEmpty()
                ? calculateRelevance(note, query) : 1.0;
            dto.lastModified = note.updatedAt;
            dto.ownerUsername = note.owner != null ? note.owner.username : null;
            dto.folderName = note.folder != null ? note.folder.name : null;
            dto.createdAt = note.createdAt;
            dto.matches = new ArrayList<>();

            // Check ownership and permissions
            boolean isOwner = note.owner != null && note.owner.id.equals(userId);
            dto.isShared = !isOwner;
            dto.canEdit = isOwner || permissionService.hasWritePermission(note.id, userId);
            dto.canDelete = isOwner;

            // Add title match if found
            if (query != null && !query.trim().isEmpty() &&
                note.title.toLowerCase().contains(query.toLowerCase())) {
                SearchMatchDTO match = new SearchMatchDTO();
                match.field = "title";
                match.value = note.title;
                match.highlights = new ArrayList<>();
                dto.matches.add(match);
            }

            // Add content match if found
            if (query != null && !query.trim().isEmpty() &&
                note.content != null && note.content.toLowerCase().contains(query.toLowerCase())) {
                SearchMatchDTO match = new SearchMatchDTO();
                match.field = "content";
                match.value = note.content;
                match.highlights = new ArrayList<>();
                dto.matches.add(match);
            }

            results.add(dto);
        }

        long took = System.currentTimeMillis() - startTime;

        SearchResponseDTO response = new SearchResponseDTO();
        response.results = results;
        response.total = results.size();
        response.took = took;
        response.suggestions = new ArrayList<>();

        return Response.ok(response).build();
    }

    private LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            // Parse ISO 8601 format (e.g., "2024-01-15T10:30:00.000Z")
            OffsetDateTime odt = OffsetDateTime.parse(dateStr, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            return odt.toLocalDateTime();
        } catch (DateTimeParseException e) {
            try {
                // Try parsing as LocalDateTime
                return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (DateTimeParseException e2) {
                try {
                    // Try parsing as date only
                    return LocalDateTime.parse(dateStr + "T00:00:00", DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                } catch (DateTimeParseException e3) {
                    return null;
                }
            }
        }
    }

    @GET
    @Path("/suggestions")
    public Response getSuggestions(
            @QueryParam("q") String query,
            @Context SecurityContext securityContext) {
        // Simple suggestions - return empty for now
        return Response.ok(new ArrayList<String>()).build();
    }

    private double calculateRelevance(Note note, String query) {
        double score = 0.0;
        String lowerQuery = query.toLowerCase();

        // Title match is worth more
        if (note.title.toLowerCase().contains(lowerQuery)) {
            score += 2.0;
            if (note.title.toLowerCase().startsWith(lowerQuery)) {
                score += 1.0;
            }
        }

        // Content match
        if (note.content.toLowerCase().contains(lowerQuery)) {
            score += 1.0;
        }

        return score;
    }

    // DTOs for search response
    public static class SearchResponseDTO {
        public List<SearchResultDTO> results;
        public int total;
        public long took;
        public List<String> suggestions;
    }

    public static class SearchResultDTO {
        public String id;
        public String type;
        public String title;
        public String excerpt;
        public List<SearchMatchDTO> matches;
        public double relevanceScore;
        public LocalDateTime lastModified;
        public LocalDateTime createdAt;
        public String ownerUsername;
        public String folderName;
        public boolean isShared;
        public boolean canEdit;
        public boolean canDelete;
    }

    public static class SearchMatchDTO {
        public String field;
        public String value;
        public List<HighlightDTO> highlights;
    }

    public static class HighlightDTO {
        public int start;
        public int end;
    }
}
