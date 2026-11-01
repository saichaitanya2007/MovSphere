package com.movsphere.controller;

import com.movsphere.entity.WarehouseLocationEntity;
import com.movsphere.repository.WarehouseLocationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/warehouse-locations")
public class WarehouseLocationController {
    private final WarehouseLocationRepository repository;

    public WarehouseLocationController(WarehouseLocationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<WarehouseLocationEntity>> getAll() {
        return ResponseEntity.ok(repository.findAllByOrderByStateAscCityAscWarehouseNameAsc());
    }
}
