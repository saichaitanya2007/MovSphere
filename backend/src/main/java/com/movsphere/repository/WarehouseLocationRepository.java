package com.movsphere.repository;

import com.movsphere.entity.WarehouseLocationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WarehouseLocationRepository extends JpaRepository<WarehouseLocationEntity, Long> {
    boolean existsByWarehouseCode(String warehouseCode);
    List<WarehouseLocationEntity> findAllByOrderByStateAscCityAscWarehouseNameAsc();
}
