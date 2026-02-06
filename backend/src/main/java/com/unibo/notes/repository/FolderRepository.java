package com.unibo.notes.repository;

import com.unibo.notes.entity.Folder;
import com.unibo.notes.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class FolderRepository implements PanacheRepository<Folder> {

    public List<Folder> findByOwner(User owner) {
        return list("owner", owner);
    }

    public List<Folder> findByOwnerId(Long ownerId) {
        return list("owner.id", ownerId);
    }

    public List<Folder> findRootFoldersByOwnerId(Long ownerId) {
        return find("SELECT f FROM Folder f LEFT JOIN FETCH f.owner WHERE f.owner.id = ?1 AND f.parent IS NULL", ownerId).list();
    }

    public List<Folder> findSubfolders(Long parentId) {
        return find("SELECT f FROM Folder f LEFT JOIN FETCH f.owner WHERE f.parent.id = ?1", parentId).list();
    }

    public Optional<Folder> findByIdAndOwner(Long folderId, Long ownerId) {
        return find("id = ?1 and owner.id = ?2", folderId, ownerId).firstResultOptional();
    }

    public Optional<Folder> findByIdWithOwner(Long folderId, Long ownerId) {
        return find("SELECT f FROM Folder f LEFT JOIN FETCH f.owner WHERE f.id = ?1 AND f.owner.id = ?2", folderId, ownerId)
                .firstResultOptional();
    }

    public Optional<Folder> findByNameAndOwner(String name, Long ownerId) {
        return find("lower(name) = lower(?1) and owner.id = ?2", name, ownerId).firstResultOptional();
    }

    public long countByOwner(Long ownerId) {
        return count("owner.id", ownerId);
    }

    public long countNotesByFolder(Long folderId) {
        return getEntityManager()
                .createQuery("SELECT COUNT(n) FROM Note n WHERE n.folder.id = :folderId", Long.class)
                .setParameter("folderId", folderId)
                .getSingleResult();
    }

    public boolean existsByNameAndOwner(String name, Long ownerId) {
        return count("lower(name) = lower(?1) and owner.id = ?2", name, ownerId) > 0;
    }
}