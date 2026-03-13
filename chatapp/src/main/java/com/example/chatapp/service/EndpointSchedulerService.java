package com.example.chatapp.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class EndpointSchedulerService {

    private final RestTemplate restTemplate;

    public EndpointSchedulerService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Scheduled(fixedRate = 30000)
    public void callEndpoint() {

        String url = "https://scapp-64qg.onrender.com";

        try {

            String response = restTemplate.getForObject(url, String.class);

            System.out.println("Scheduled API Response:");
            System.out.println(response);

        } catch (Exception e) {
            System.out.println("Error calling endpoint: " + e.getMessage());
        }
    }
}