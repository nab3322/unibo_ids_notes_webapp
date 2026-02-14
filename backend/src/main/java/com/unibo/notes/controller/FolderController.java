package com.unibo.notes.controller;

import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import io.quarkus.security.Authenticated;
import com.unibo.notes.dto.FolderDTO;
import com.unibo.notes.entity.Folder;
import com.unibo.notes.service.FolderService;
import io.smallrye.jwt.auth.principal.JWTCallerPrincipal;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;
import java.util.stream.Collectors;

@Path("/api/folders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class FolderController {

    @Inject
    FolderService folderService;

    private Long getUserId(SecurityContext securityContext) {
        if (securityContext.getUserPrincipal() == null) {
            throw new SecurityException("No authentication token");
        }
        JWTCallerPrincipal principal = (JWTCallerPrincipal) securityContext.getUserPrincipal();
        return Long.parseLong(principal.getSubject());
    }

    @GET
    public Response getRootFolders(@Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        List<Folder> folders = folderService.getRootFolders(userId);
        List<FolderDTO> dtos = folders.stream()
                .map(f -> toDTO(f, userId))
                .collect(Collectors.toList());
        return Response.ok(dtos).build();
    }

    @GET
    @Path("/{folderId}")
    public Response getFolderById(@PathParam("folderId") Long folderId,
                                  @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        Folder folder = folderService.getFolderById(folderId, userId);
        return Response.ok(toDTO(folder, userId)).build();
    }

    @GET
    @Path("/{folderId}/subfolders")
    public Response getSubfolders(@PathParam("folderId") Long folderId,
                                  @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        List<Folder> subfolders = folderService.getSubfolders(folderId, userId);
        List<FolderDTO> dtos = subfolders.stream()
                .map(f -> toDTO(f, userId))
                .collect(Collectors.toList());
        return Response.ok(dtos).build();
    }

    @POST
    public Response createFolder(CreateFolderRequest request,
                                 @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        Folder folder = folderService.createFolder(
                request.name,
                request.description,
                request.parentId,
                userId
        );
        return Response.status(Response.Status.CREATED).entity(toDTO(folder, userId)).build();
    }

    @PUT
    @Path("/{folderId}")
    public Response updateFolder(@PathParam("folderId") Long folderId,
                                 UpdateFolderRequest request,
                                 @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        Folder folder = folderService.updateFolder(folderId, request.name, request.description, userId);
        return Response.ok(toDTO(folder, userId)).build();
    }

    @DELETE
    @Path("/{folderId}")
    @APIResponse(responseCode = "204", description = "Cartella cancellata con successo")
    public Response deleteFolder(@PathParam("folderId") Long folderId,
                                 @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        folderService.deleteFolder(folderId, userId);
        return Response.noContent().build();
    }

    @GET
    @Path("/{folderId}/notes/count")
    public Response countNotes(@PathParam("folderId") Long folderId,
                               @Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        long count = folderService.countNotesByFolder(folderId, userId);
        return Response.ok(new CountResponse(count)).build();
    }

    private FolderDTO toDTO(Folder folder, Long userId) {
        FolderDTO dto = new FolderDTO();
        dto.id = folder.id;
        dto.name = folder.name;
        dto.description = folder.description;
        dto.ownerId = folder.owner != null ? folder.owner.id : null;
        dto.ownerUsername = folder.owner != null ? folder.owner.username : null;
        dto.parentId = folder.parent != null ? folder.parent.id : null;
        dto.isShared = folder.isShared;
        dto.createdAt = folder.createdAt;
        dto.notesCount = folderService.countNotesByFolder(folder.id, userId);
        return dto;
    }

    // DTO interni per request/response
    public static class CreateFolderRequest {
        public String name;
        public String description;
        public Long parentId;
    }

    public static class UpdateFolderRequest {
        public String name;
        public String description;
    }

    public static class CountResponse {
        public long count;
        public CountResponse(long count) {
            this.count = count;
        }
    }
}
