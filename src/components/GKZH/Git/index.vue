<template>
  <div>
    <svg-icon icon-class="github" @click="goto" />
  </div>
</template>

<script>
export default {
  name: 'GKZHGit',
  data() {
    return {
      url: 'https://gitee.com/gkzhihui/gkzh.git'
    }
  },
  methods: {
    goto() {
      window.open(this.url)
    }
  }
}
</script>
