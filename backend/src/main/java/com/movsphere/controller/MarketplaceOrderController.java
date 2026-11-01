package com.movsphere.controller;

import com.movsphere.dto.MarketplaceOrderRequest;
import com.movsphere.entity.MarketplaceOrderEntity;
import com.movsphere.entity.UserEntity;
import com.movsphere.entity.UserNotificationEntity;
import com.movsphere.repository.MarketplaceOrderRepository;
import com.movsphere.repository.UserNotificationRepository;
import com.movsphere.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/marketplace-orders")
public class MarketplaceOrderController {
    private final MarketplaceOrderRepository orderRepository;
    private final UserNotificationRepository notificationRepository;
    private final UserService userService;

    public MarketplaceOrderController(MarketplaceOrderRepository orderRepository,
                                       UserNotificationRepository notificationRepository,
                                       UserService userService) {
        this.orderRepository = orderRepository;
        this.notificationRepository = notificationRepository;
        this.userService = userService;
    }

    @GetMapping("/mine")
    public ResponseEntity<List<MarketplaceOrderEntity>> getMine(@AuthenticationPrincipal UserDetails details) {
        UserEntity buyer = userService.findByEmail(details.getUsername());
        return ResponseEntity.ok(orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId()));
    }

    @PostMapping
    public ResponseEntity<MarketplaceOrderEntity> create(@AuthenticationPrincipal UserDetails details,
                                                         @Valid @RequestBody MarketplaceOrderRequest request) {
        UserEntity buyer = userService.findByEmail(details.getUsername());
        MarketplaceOrderEntity order = new MarketplaceOrderEntity();
        order.setOrderNumber(request.getOrderNumber());
        order.setBuyerId(buyer.getId());
        order.setSellerId(request.getSellerId());
        order.setProductId(request.getProductId());
        order.setProductName(request.getProductName());
        order.setQuantity(request.getQuantity());
        order.setUnitType(request.getUnitType());
        order.setPricePerUnit(request.getPricePerUnit());
        order.setTotalAmount(request.getTotalAmount());
        order.setDeliveryDays(request.getDeliveryDays());
        order.setPresentLocation(request.getPresentLocation());
        order.setStatus("ORDER_PLACED");
        order.setSellerName(request.getSellerName());
        MarketplaceOrderEntity saved = orderRepository.save(order);

        if (request.getSellerId() != null && !request.getSellerId().equals(buyer.getId())) {
            UserNotificationEntity notification = new UserNotificationEntity();
            notification.setRecipientUserId(request.getSellerId());
            notification.setType("MARKETPLACE_ORDER");
            notification.setMessage(buyer.getName() + " ordered " + request.getQuantity() + " " + request.getUnitType().toLowerCase() + " of " + request.getProductName() + ". Order " + request.getOrderNumber() + " is expected in " + request.getDeliveryDays() + " days.");
            notificationRepository.save(notification);
        }
        return ResponseEntity.ok(saved);
    }
}
