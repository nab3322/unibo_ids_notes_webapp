package com.unibo.notes.repository;

import com.unibo.notes.entity.NotePermission;
import com.unibo.notes.entity.NotePermission.PermissionType;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class NotePermissionRepository implements PanacheRepository<NotePermission> {

    public List<NotePermission> findByNoteId(Long noteId) {
        return list("note.id", noteId);
    }

    public List<NotePermission> findByUserId(Long userId) {
        return list("user.id", userId);
    }

    /**
     * Trova permessi per userId con note e owner caricati eagerly
     */
    public List<NotePermission> findByUserIdWithNotes(Long userId) {
        return find("SELECT p FROM NotePermission p LEFT JOIN FETCH p.note n LEFT JOIN FETCH n.owner WHERE p.user.id = ?1", userId)
                .list();
    }

    public Optional<NotePermission> findByNoteIdAndUserId(Long noteId, Long userId) {
        return find("note.id = ?1 and user.id = ?2", noteId, userId).firstResultOptional();
    }

    public boolean hasPermission(Long noteId, Long userId, PermissionType permission) {
        if (permission == PermissionType.READ) {
            // READ permission includes WRITE permission
            return count("note.id = ?1 and user.id = ?2", noteId, userId) > 0;
        } else {
            // WRITE permission specifically
            return count("note.id = ?1 and user.id = ?2 and permission = ?3",
                    noteId, userId, PermissionType.WRITE) > 0;
        }
    }

    public List<NotePermission> findWritePermissionsByNoteId(Long noteId) {
        return list("note.id = ?1 and permission = ?2", noteId, PermissionType.WRITE);
    }

    public void deleteByNoteIdAndUserId(Long noteId, Long userId) {
        delete("note.id = ?1 and user.id = ?2", noteId, userId);
    }

    public long countByNoteId(Long noteId) {
        return count("note.id", noteId);
    }
}