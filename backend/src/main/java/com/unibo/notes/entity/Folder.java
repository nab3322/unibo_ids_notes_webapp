package com.unibo.notes.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "folders")
public class Folder extends PanacheEntityBase {

    private static final ZoneId ROME_ZONE = ZoneId.of("Europe/Rome");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 100)
    public String name;

    @Column(length = 255)
    public String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnore
    public User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonIgnore
    public Folder parent; // Per cartelle annidate

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @JsonIgnore
    public Set<Folder> subfolders = new HashSet<>();

    @OneToMany(mappedBy = "folder", cascade = CascadeType.ALL)
    @JsonIgnore
    public Set<Note> notes = new HashSet<>();

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "is_shared")
    public Boolean isShared = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ROME_ZONE);
    }
}