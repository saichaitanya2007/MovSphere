package com.movsphere.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_notifications")
public class UserNotificationEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "recipient_user_id", nullable = false) private Long recipientUserId;
    @Column(nullable = false, length = 40) private String type;
    @Column(nullable = false, length = 255) private String message;
    @Column(nullable = false) private Boolean read = false;
    @Column(nullable = false, updatable = false) private Instant createdAt;

    @PrePersist public void prePersist() { createdAt = Instant.now(); if (read == null) read = false; }
    public Long getId() { return id; }
    public Long getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(Long value) { recipientUserId = value; }
    public String getType() { return type; }
    public void setType(String value) { type = value; }
    public String getMessage() { return message; }
    public void setMessage(String value) { message = value; }
    public Boolean getRead() { return read; }
    public void setRead(Boolean value) { read = value; }
    public Instant getCreatedAt() { return createdAt; }
}
