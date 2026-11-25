package com.hackathon.resourceallocation.repository;

import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NeedRepository extends JpaRepository<Need, Long>, JpaSpecificationExecutor<Need> {

    @Query("SELECT n FROM Need n WHERE n.latitude IS NOT NULL AND n.longitude IS NOT NULL ORDER BY n.priorityScore DESC")
    List<Need> findAllWithCoordinates();

    @Query("SELECT n FROM Need n WHERE n.urgency IS NULL OR n.priorityScore IS NULL")
    List<Need> findUnanalyzedNeeds();

    long countByStatus(Need.NeedStatus status);
    long countByUrgency(Need.UrgencyLevel urgency);

    List<Need> findByCreatedBy(User user);
    List<Need> findByCreatedByAndStatus(User user, Need.NeedStatus status);
}
