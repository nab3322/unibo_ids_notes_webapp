package com.unibo.notes.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(unique = true, nullable = false, length = 50)
    public String username;

    @Column(nullable = false)
    @JsonIgnore
    public String passwordHash;

    @Column(unique = true, length = 100)
    public String email;

    @Column(length = 100)
    public String name;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    public Set<Note> ownedNotes = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    public Set<NotePermission> notePermissions = new HashSet<>();

    private static final ZoneId ROME_ZONE = ZoneId.of("Europe/Rome");

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ROME_ZONE);
    }
}