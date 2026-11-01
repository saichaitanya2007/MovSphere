package com.movsphere.repository;

import com.movsphere.entity.UserNotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserNotificationRepository extends JpaRepository<UserNotificationEntity, Long> {
    List<UserNotificationEntity> findTop50ByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId);
    java.util.Optional<UserNotificationEntity> findByIdAndRecipientUserId(Long id, Long recipientUserId);
}
