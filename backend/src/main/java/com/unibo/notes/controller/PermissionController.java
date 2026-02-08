package com.unibo.notes.controller;

import io.quarkus.security.Authenticated;
import com.unibo.notes.dto.NoteDTO;
import com.unibo.notes.dto.NoteListResponse;
import com.unibo.notes.dto.PermissionDTO;
import com.unibo.notes.dto.ShareNoteRequest;
import com.unibo.notes.entity.Note;
import com.unibo.notes.service.PermissionService;
import io.smallrye.jwt.auth.principal.JWTCallerPrincipal;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;
import java.util.stream.Collectors;

@Path("/permissions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class PermissionController {

    @Inject
    PermissionService permissionService;

    private Long getUserId(SecurityContext securityContext) {
        if (securityContext.getUserPrincipal() == null) {
            throw new SecurityException("No authentication token");
        }
        JWTCallerPrincipal principal = (JWTCallerPrincipal) securityContext.getUserPrincipal();
        return Long.parseLong(principal.getSubject());
    }

    @POST
    @Path("/notes/{noteId}/share")
    public Response shareNote(@PathParam("noteId") Long noteId,
                              @Valid ShareNoteRequest request,
                              @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        PermissionDTO permission = permissionService.shareNote(noteId, request, userId);
        return Response.status(Response.Status.CREATED).entity(permission).build();
    }

    @GET
    @Path("/notes/{noteId}")
    public Response getNotePermissions(@PathParam("noteId") Long noteId,
                                       @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        List<PermissionDTO> permissions = permissionService.getNotePermissions(noteId, userId);
        return Response.ok(permissions).build();
    }

    @DELETE
    @Path("/notes/{noteId}/users/{targetUserId}")
    public Response revokePermission(@PathParam("noteId") Long noteId,
                                     @PathParam("targetUserId") Long targetUserId,
                                     @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        permissionService.revokePermission(noteId, targetUserId, userId);
        return Response.noContent().build();
    }

    @PUT
    @Path("/notes/{noteId}/users/{targetUserId}")
    public Response updatePermission(@PathParam("noteId") Long noteId,
                                     @PathParam("targetUserId") Long targetUserId,
                                     UpdatePermissionRequest request,
                                     @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        PermissionDTO permission = permissionService.updatePermission(noteId, targetUserId, request.permission, userId);
        return Response.ok(permission).build();
    }

    public static class UpdatePermissionRequest {
        public String permission;
    }

    @GET
    @Path("/shared-with-me")
    public Response getSharedNotes(@Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        List<Note> sharedNotes = permissionService.getSharedNotes(userId);
        List<NoteDTO> noteDTOs = sharedNotes.stream()
                .map(note -> toDTO(note, userId))
                .collect(Collectors.toList());
        return Response.ok(new NoteListResponse(noteDTOs)).build();
    }

    @DELETE
    @Path("/notes/{noteId}/leave")
    public Response leaveNote(@PathParam("noteId") Long noteId,
                              @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        permissionService.leaveNote(noteId, userId);
        return Response.noContent().build();
    }

    private NoteDTO toDTO(Note note, Long userId) {
        NoteDTO dto = new NoteDTO();
        dto.id = note.id;
        dto.title = note.title;
        dto.content = note.content;
        dto.ownerId = note.owner != null ? note.owner.id : null;
        dto.ownerUsername = note.owner != null ? note.owner.username : null;
        dto.createdAt = note.createdAt;
        dto.setUpdatedAt(note.updatedAt);
        dto.setVersion(note.version);
        dto.folderId = note.folder != null ? note.folder.id : null;
        dto.folderName = note.folder != null ? note.folder.name : null;
        dto.isShared = true;
        // Controlla se l'utente ha permesso di scrittura
        dto.canEdit = permissionService.hasWritePermission(note.id, userId);
        dto.canDelete = false;
        return dto;
    }
}
