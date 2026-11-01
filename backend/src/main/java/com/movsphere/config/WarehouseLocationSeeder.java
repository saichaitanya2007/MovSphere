package com.movsphere.config;

import com.movsphere.entity.WarehouseLocationEntity;
import com.movsphere.repository.WarehouseLocationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WarehouseLocationSeeder {
    private static final String[][] LOCATIONS = {
        {"Andhra Pradesh","Vijayawada","16.5062","80.6480"},{"Arunachal Pradesh","Itanagar","27.0844","93.6053"},{"Assam","Guwahati","26.1445","91.7362"},{"Bihar","Patna","25.5941","85.1376"},{"Chhattisgarh","Raipur","21.2514","81.6296"},{"Goa","Panaji","15.4909","73.8278"},{"Gujarat","Ahmedabad","23.0225","72.5714"},{"Haryana","Gurugram","28.4595","77.0266"},{"Himachal Pradesh","Shimla","31.1048","77.1734"},{"Jharkhand","Ranchi","23.3441","85.3096"},{"Karnataka","Bengaluru","12.9716","77.5946"},{"Kerala","Kochi","9.9312","76.2673"},{"Madhya Pradesh","Indore","22.7196","75.8577"},{"Maharashtra","Pune","18.5204","73.8567"},{"Manipur","Imphal","24.8170","93.9368"},{"Meghalaya","Shillong","25.5788","91.8933"},{"Mizoram","Aizawl","23.7271","92.7176"},{"Nagaland","Kohima","25.6751","94.1086"},{"Odisha","Bhubaneswar","20.2961","85.8245"},{"Punjab","Ludhiana","30.9010","75.8573"},{"Rajasthan","Jaipur","26.9124","75.7873"},{"Sikkim","Gangtok","27.3389","88.6065"},{"Tamil Nadu","Chennai","13.0827","80.2707"},{"Telangana","Hyderabad","17.3850","78.4867"},{"Tripura","Agartala","23.8315","91.2868"},{"Uttar Pradesh","Lucknow","26.8467","80.9462"},{"Uttarakhand","Dehradun","30.3165","78.0322"},{"West Bengal","Kolkata","22.5726","88.3639"},{"Andaman and Nicobar Islands","Port Blair","11.6234","92.7265"},{"Chandigarh","Chandigarh","30.7333","76.7794"},{"Dadra and Nagar Haveli and Daman and Diu","Daman","20.3974","72.8328"},{"Delhi","New Delhi","28.6139","77.2090"},{"Jammu and Kashmir","Jammu","32.7266","74.8570"},{"Ladakh","Leh","34.1526","77.5771"},{"Lakshadweep","Kavaratti","10.5669","72.6420"},{"Puducherry","Puducherry","11.9416","79.8083"}
    };

    @Bean
    CommandLineRunner seedWarehouseLocations(WarehouseLocationRepository repository) {
        return args -> {
            for (String[] location : LOCATIONS) {
                for (int slot = 1; slot <= 4; slot++) {
                    String code = "WH-" + String.format("%02d", java.util.Arrays.asList(LOCATIONS).indexOf(location) + 1) + "-" + slot;
                    if (repository.existsByWarehouseCode(code)) continue;
                    WarehouseLocationEntity warehouse = new WarehouseLocationEntity();
                    warehouse.setWarehouseCode(code);
                    warehouse.setState(location[0]);
                    warehouse.setCity(location[1]);
                    warehouse.setWarehouseName(location[1] + " Distribution Hub " + slot);
                    warehouse.setAddress("MovSphere Logistics Park, Sector " + (slot * 3) + ", " + location[1]);
                    warehouse.setLatitude(Double.parseDouble(location[2]) + (slot - 2.5) * 0.018);
                    warehouse.setLongitude(Double.parseDouble(location[3]) + (slot - 2.5) * 0.018);
                    repository.save(warehouse);
                }
            }
        };
    }
}
