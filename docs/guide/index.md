---
title: Guide Overview
---

## Guide

This guide covers the core concepts and features of fixtures-ts.

## Topics

### [Defining Fixtures](defining-fixtures)

Learn how to create fixtures with the `defineFixture` function, including setup and cleanup logic.

### [Dependencies](dependencies)

Understand how fixture dependencies work, including automatic resolution, shared dependencies, and circular dependency detection.

### [Cleanup](cleanup)

Learn about the cleanup lifecycle and how to properly manage resource cleanup in your fixtures.

## Core Concepts

### Fixtures

A fixture is a reusable test resource that can be set up and torn down automatically. Fixtures can depend on other fixtures.

### Registry

A registry is a collection of all your fixtures, typed with TypeScript for full type safety.

### Dependencies

Fixtures can declare dependencies on other fixtures. The system automatically resolves the dependency graph and sets up fixtures in the correct order.

### Cleanup

Each fixture can define a cleanup function that runs when the test is complete. Cleanup happens in reverse dependency order.
