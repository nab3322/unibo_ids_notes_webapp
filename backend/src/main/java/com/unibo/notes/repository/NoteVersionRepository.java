package com.unibo.notes.repository;

import com.unibo.notes.entity.NoteVersion;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class NoteVersionRepository implements PanacheRepository<NoteVersion> {

    public List<NoteVersion> findByNoteId(Long noteId) {
        return list("noteId = ?1 order by versionNumber desc", noteId);
    }

    public Optional<NoteVersion> findByNoteIdAndVersionNumber(Long noteId, Long versionNumber) {
        return find("noteId = ?1 and versionNumber = ?2", noteId, versionNumber).firstResultOptional();
    }

    public Optional<NoteVersion> findLatestVersion(Long noteId) {
        return find("noteId = ?1 order by versionNumber desc", noteId).firstResultOptional();
    }

    public long getNextVersionNumber(Long noteId) {
        NoteVersion latest = find("noteId = ?1", Sort.by("versionNumber", Sort.Direction.Descending), noteId)
                .firstResult();
        return (latest != null) ? latest.versionNumber + 1 : 1L;
    }

    public long countByNoteId(Long noteId) {
        return count("noteId = ?1", noteId);
    }

    public void deleteOldVersions(Long noteId, int keepLast) {
        List<NoteVersion> versions = findByNoteId(noteId);
        if (versions.size() > keepLast) {
            // Keep only the last N versions
            List<NoteVersion> toDelete = versions.subList(keepLast, versions.size());
            delete("id in ?1", toDelete.stream().map(v -> v.id).toList());
        }
    }
}