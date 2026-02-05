package com.unibo.notes.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "notes")
public class Note extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 100)
    public String title;

    @Column(nullable = false, length = 280)
    public String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnore
    public User owner;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @Version
    @Column(name = "version")
    public Long version;

    @Column(name = "last_modified_by")
    public Long lastModifiedBy;

    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, orphanRemoval = true)
    public Set<NotePermission> permissions = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    public Folder folder;

    private static final ZoneId ROME_ZONE = ZoneId.of("Europe/Rome");

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ROME_ZONE);
        updatedAt = LocalDateTime.now(ROME_ZONE);
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ROME_ZONE);
    }
}