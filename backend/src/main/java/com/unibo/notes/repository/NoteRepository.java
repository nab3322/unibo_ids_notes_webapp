package com.unibo.notes.repository;

import com.unibo.notes.entity.Note;
import com.unibo.notes.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class NoteRepository implements PanacheRepository<Note> {

    public List<Note> findByOwner(User owner) {
        return list("owner", owner);
    }

    public List<Note> findByOwnerId(Long ownerId) {
        return list("owner.id", ownerId);
    }

    public Optional<Note> findByIdAndOwner(Long noteId, Long ownerId) {
        return find("id = ?1 and owner.id = ?2", noteId, ownerId).firstResultOptional();
    }

    /**
     * Trova nota per ID con owner e folder caricati eagerly (evita LazyInitializationException)
     */
    public Optional<Note> findByIdWithOwnerAndFolder(Long noteId) {
        return find("SELECT n FROM Note n LEFT JOIN FETCH n.owner LEFT JOIN FETCH n.folder WHERE n.id = ?1", noteId)
                .firstResultOptional();
    }

    public List<Note> searchByContent(String keyword, Long ownerId) {
        return list("(lower(title) like lower(?1) or lower(content) like lower(?1)) and owner.id = ?2",
                "%" + keyword + "%", ownerId);
    }

    public List<Note> findByTag(String tagName, Long ownerId) {
        return list("select distinct n from Note n join n.tags t where lower(t.name) = lower(?1) and n.owner.id = ?2",
                tagName, ownerId);
    }

    public long countByOwner(Long ownerId) {
        return count("owner.id", ownerId);
    }

    /**
     * Advanced search with multiple filters
     */
    public List<Note> advancedSearch(Long userId, String keyword, String author,
                                      Long folderId, LocalDateTime createdFrom,
                                      LocalDateTime createdTo, LocalDateTime modifiedFrom,
                                      LocalDateTime modifiedTo, boolean includeShared) {
        StringBuilder query = new StringBuilder("SELECT DISTINCT n FROM Note n LEFT JOIN FETCH n.owner LEFT JOIN FETCH n.folder");

        if (includeShared) {
            query.append(" LEFT JOIN NotePermission p ON p.note.id = n.id AND p.user.id = :userId");
        }

        query.append(" WHERE (n.owner.id = :userId");
        if (includeShared) {
            query.append(" OR p.user.id = :userId");
        }
        query.append(")");

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);

        if (keyword != null && !keyword.trim().isEmpty()) {
            query.append(" AND (LOWER(n.title) LIKE LOWER(:keyword) OR LOWER(n.content) LIKE LOWER(:keyword))");
            params.put("keyword", "%" + keyword.trim() + "%");
        }

        if (author != null && !author.trim().isEmpty()) {
            query.append(" AND LOWER(n.owner.username) LIKE LOWER(:author)");
            params.put("author", "%" + author.trim() + "%");
        }

        if (folderId != null) {
            query.append(" AND n.folder.id = :folderId");
            params.put("folderId", folderId);
        }

        if (createdFrom != null) {
            query.append(" AND n.createdAt >= :createdFrom");
            params.put("createdFrom", createdFrom);
        }

        if (createdTo != null) {
            query.append(" AND n.createdAt <= :createdTo");
            params.put("createdTo", createdTo);
        }

        if (modifiedFrom != null) {
            query.append(" AND n.updatedAt >= :modifiedFrom");
            params.put("modifiedFrom", modifiedFrom);
        }

        if (modifiedTo != null) {
            query.append(" AND n.updatedAt <= :modifiedTo");
            params.put("modifiedTo", modifiedTo);
        }

        query.append(" ORDER BY n.updatedAt DESC");

        var panacheQuery = find(query.toString(), params);
        return panacheQuery.list();
    }
}