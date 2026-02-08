package com.unibo.notes.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "note_permissions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"note_id", "user_id"}))
public class NotePermission extends PanacheEntityBase {

    private static final ZoneId ROME_ZONE = ZoneId.of("Europe/Rome");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    public Note note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public PermissionType permission;

    @Column(name = "granted_at", nullable = false)
    public LocalDateTime grantedAt;

    @PrePersist
    protected void onCreate() {
        grantedAt = LocalDateTime.now(ROME_ZONE);
    }

    public enum PermissionType {
        READ,
        WRITE
    }
}