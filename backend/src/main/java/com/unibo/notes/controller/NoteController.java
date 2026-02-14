package com.unibo.notes.controller;

import io.quarkus.security.Authenticated;
import com.unibo.notes.dto.CreateNoteRequest;
import com.unibo.notes.dto.NoteDTO;
import com.unibo.notes.dto.NoteListResponse;
import com.unibo.notes.dto.NoteStatsDTO;
import com.unibo.notes.dto.NoteVersionDTO;
import com.unibo.notes.dto.UpdateNoteRequest;
import com.unibo.notes.entity.Note;
import com.unibo.notes.service.NoteService;
import com.unibo.notes.service.PermissionService;
import com.unibo.notes.service.VersionService;
import io.smallrye.jwt.auth.principal.JWTCallerPrincipal;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Path("/api/notes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class NoteController {

    @Inject
    NoteService noteService;

    @Inject
    VersionService versionService;

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
    public Response getAllNotes(@QueryParam("folderId") Long folderId,
                                @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        List<Note> notes;
        if (folderId != null) {
            notes = noteService.getNotesByFolder(folderId, userId);
        } else {
            notes = noteService.getAllNotesByUser(userId);
        }
        List<NoteDTO> noteDTOs = notes.stream().map(this::toDTO).collect(Collectors.toList());
        return Response.ok(new NoteListResponse(noteDTOs)).build();
    }

    @GET
    @Path("/statistics")
    public Response getStatistics(@Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        NoteStatsDTO stats = noteService.getStatistics(userId);
        return Response.ok(stats).build();
    }

    @GET
    @Path("/tags")
    public Response getAllTags(@Context SecurityContext securityContext) {
        // Ora Collections è importato correttamente
        return Response.ok(Collections.emptyList()).build();
    }

    @GET
    @Path("/{noteId}")
    public Response getNoteById(@PathParam("noteId") Long noteId,
                                @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        Note note = noteService.getNoteById(noteId, userId);
        return Response.ok(toDTO(note, userId)).build();
    }

    @GET
    @Path("/folder/{folderId}")
    public Response getNotesByFolder(@PathParam("folderId") Long folderId,
                                     @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        List<Note> notes = noteService.getNotesByFolder(folderId, userId);
        List<NoteDTO> noteDTOs = notes.stream().map(this::toDTO).collect(Collectors.toList());
        return Response.ok(new NoteListResponse(noteDTOs)).build();
    }

    @POST
    public Response createNote(@Valid CreateNoteRequest request,
                               @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        Note note = noteService.createNote(request, userId);
        return Response.status(Response.Status.CREATED).entity(toDTO(note)).build();
    }

    @PUT
    @Path("/{noteId}")
    public Response updateNote(@PathParam("noteId") Long noteId,
                               @Valid UpdateNoteRequest request,
                               @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        Note note = noteService.updateNote(noteId, request, userId);
        return Response.ok(toDTO(note)).build();
    }

    @DELETE
    @Path("/{noteId}")
    public Response deleteNote(@PathParam("noteId") Long noteId,
                               @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        noteService.deleteNote(noteId, userId);
        return Response.noContent().build();
    }

    @PUT
    @Path("/{noteId}/move")
    public Response moveNote(@PathParam("noteId") Long noteId,
                             MoveNoteRequest request,
                             @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        Note note = noteService.moveNoteToFolder(noteId, request.folderId, userId);
        return Response.ok(toDTO(note)).build();
    }

    @POST
    @Path("/{noteId}/copy")
    public Response copyNote(@PathParam("noteId") Long noteId,
                             @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        Note copy = noteService.copyNote(noteId, userId);
        return Response.status(Response.Status.CREATED).entity(toDTO(copy)).build();
    }

    @GET
    @Path("/search")
    public Response searchNotes(@QueryParam("q") String keyword,
                                @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        List<Note> notes = noteService.searchNotes(keyword, userId);
        List<NoteDTO> noteDTOs = notes.stream().map(this::toDTO).collect(Collectors.toList());
        return Response.ok(new NoteListResponse(noteDTOs)).build();
    }

    @GET
    @Path("/{noteId}/versions")
    public Response getVersions(@PathParam("noteId") Long noteId,
                                @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        List<NoteVersionDTO> versions = versionService.getNoteVersions(noteId, userId);
        return Response.ok(versions).build();
    }

    @GET
    @Path("/{noteId}/versions/{versionNumber}")
    public Response getSpecificVersion(@PathParam("noteId") Long noteId,
                                       @PathParam("versionNumber") Long versionNumber,
                                       @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        NoteVersionDTO version = versionService.getSpecificVersion(noteId, versionNumber, userId);
        return Response.ok(version).build();
    }

    @POST
    @Path("/{noteId}/versions/{versionNumber}/restore")
    public Response restoreVersion(@PathParam("noteId") Long noteId,
                                   @PathParam("versionNumber") Long versionNumber,
                                   @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        Note note = versionService.restoreVersion(noteId, versionNumber, userId);
        return Response.ok(toDTO(note)).build();
    }

    private NoteDTO toDTO(Note note) {
        return toDTO(note, null);
    }

    private NoteDTO toDTO(Note note, Long userId) {
        NoteDTO dto = new NoteDTO();
        dto.id = note.id;
        dto.title = note.title;
        dto.content = note.content;
        dto.ownerId = note.owner != null ? note.owner.id : null;
        dto.ownerUsername = note.owner != null ? note.owner.username : null;
        dto.createdAt = note.createdAt;
        dto.setUpdatedAt(note.updatedAt); // Imposta sia updatedAt che modifiedAt
        dto.setVersion(note.version); // Imposta sia version che versionNumber
        dto.folderId = note.folder != null ? note.folder.id : null;
        dto.folderName = note.folder != null ? note.folder.name : null;

        // Determina i permessi basati sull'utente
        boolean isOwner = note.owner != null && userId != null && note.owner.id.equals(userId);
        dto.isShared = !isOwner && userId != null;
        dto.canEdit = isOwner || (userId != null && permissionService.hasWritePermission(note.id, userId));
        dto.canDelete = isOwner;
        return dto;
    }

    public static class MoveNoteRequest {
        public Long folderId;
    }
}