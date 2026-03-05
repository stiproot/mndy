<template>
  <div id="app">
    <q-layout view="hHh lpR fFf">
      <q-header elevated class="bg-primary text-white">
        <q-toolbar>
          <q-toolbar-title>
            mndy-azdo - Azure DevOps Tools
          </q-toolbar-title>
          <q-space />
          <q-btn flat round dense icon="content_copy" @click="$router.push('/clone')" title="Clone Work Item" />
          <q-btn flat round dense icon="dashboard" @click="$router.push('/dashboard')" title="Create Dashboard" />
          <q-btn flat round dense icon="playlist_add" @click="$router.push('/bulk')" title="Bulk Create" />
          <q-btn flat round dense icon="edit" @click="$router.push('/update')" title="Update Work Item" />
        </q-toolbar>
      </q-header>

      <q-page-container>
        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup lang="ts">
// Standalone AzDO module app
// This runs when azdo is accessed directly (not via Module Federation)
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
