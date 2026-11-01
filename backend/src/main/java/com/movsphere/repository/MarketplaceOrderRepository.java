package com.movsphere.repository;

import com.movsphere.entity.MarketplaceOrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MarketplaceOrderRepository extends JpaRepository<MarketplaceOrderEntity, Long> {
    List<MarketplaceOrderEntity> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);
}
