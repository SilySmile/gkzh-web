<template>
  <el-select
    :value="value"
    clearable
    filterable
    :disabled="!schoolId"
    :placeholder="schoolId ? '请选择活动' : '请先选择学校'"
    @input="onInput"
  >
    <el-option
      v-for="item in activities"
      :key="item.instanceId"
      :label="item.title || item.name"
      :value="item.instanceId"
    />
  </el-select>
</template>

<script>
import { listInstances } from '@/api/activity/week'

/**
 * 学校-活动联动选择：必须先选择学校，活动下拉只列出该校的活动实例。
 * 学校变化时清空已选活动并重新加载，避免跨学校筛选。
 */
export default {
  name: 'SchoolActivitySelect',
  props: {
    // 已选活动实例编号，配合 v-model 使用。
    value: {
      type: [Number, String],
      default: null,
    },
    // 当前学校编号；为空时活动下拉禁用。
    schoolId: {
      type: [Number, String],
      default: null,
    },
  },
  data() {
    return {
      activities: [],
    }
  },
  watch: {
    schoolId() {
      // 学校变化后旧活动一定不属于新学校，先清空再按新学校加载。
      this.$emit('input', null)
      this.load()
    },
  },
  mounted() {
    this.load()
  },
  methods: {
    load() {
      this.activities = []
      if (!this.schoolId) return
      const schoolId = this.schoolId
      listInstances({ schoolId })
        .then((res) => {
          // 快速切换学校时，忽略旧请求的迟到响应。
          if (this.schoolId !== schoolId) return
          this.activities = res.data || res.rows || []
        })
        .catch(() => {
          if (this.schoolId === schoolId) {
            this.$modal.msgError('活动列表加载失败，请稍后重试')
          }
        })
    },
    onInput(value) {
      this.$emit('input', value)
    },
  },
}
</script>
