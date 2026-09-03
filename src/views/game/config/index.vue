<template>
  <div class="app-container">
    <el-form :inline="true" size="small">
      <el-form-item label="游戏类别">
        <el-select v-model="queryParams.category" clearable placeholder="全部类别" @change="getList">
          <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="getList">查询</el-button>
        <el-button type="success" icon="el-icon-plus" @click="openDialog">新增游戏配置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="configList" v-loading="loading" border>
      <el-table-column label="ID" prop="configId" width="80" />
      <el-table-column label="游戏类别" width="140">
        <template slot-scope="scope">{{ categoryName(scope.row.category) }}</template>
      </el-table-column>
      <el-table-column label="游戏名称" prop="gameName" />
      <el-table-column label="路由" prop="route" width="130" />
      <el-table-column label="参与人物画像" width="130" align="center">
        <template slot-scope="scope">
          <el-tag :type="portraitEnabled(scope.row) ? 'success' : 'info'">{{ portraitEnabled(scope.row) ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === '0'" type="success">启用</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="openDialog(scope.row)">编辑</el-button>
          <el-button type="text" size="mini" @click="removeConfig(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="form.configId ? '编辑游戏配置' : '新增游戏配置'" :visible.sync="dialogVisible" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="游戏类别">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="选择" value="choice" />
            <el-option label="答题" value="answer" />
            <el-option label="合作" value="cooperation" />
          </el-select>
        </el-form-item>
        <el-form-item label="游戏名称"><el-input v-model="form.gameName" /></el-form-item>
        <el-form-item label="前端路由"><el-input v-model="form.route" :disabled="form.gameType === 'zycck'" placeholder="例如 zycck" /><div v-if="form.gameType === 'zycck'" class="form-tip">未来职业猜猜看固定使用 zycck 路由</div></el-form-item>
        <el-form-item label="参与人物画像"><el-switch v-model="portraitEnabledValue" active-text="是" inactive-text="否" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">启用</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitConfig">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listGameConfigs, saveGameConfig, delGameConfig } from '@/api/activity/week'
import { zycckErrorMessage } from '@/api/zycck'

export default {
  name: 'GameConfig',
  data() {
    return {
      loading: false,
      // 游戏配置按合作/选择/答题分类筛选，避免把具体游戏名称当作类型。
      categoryOptions: [
        { label: '选择', value: 'choice' },
        { label: '答题', value: 'answer' },
        { label: '合作', value: 'cooperation' }
      ],
      configList: [],
      queryParams: { category: null },
      dialogVisible: false,
      form: {}
    }
  },
  computed: {
    portraitEnabledValue: {
      get() { return this.portraitEnabled(this.form) },
      set(value) { this.form.participatePortrait = value ? '1' : '0' }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listGameConfigs(this.queryParams.category).then(res => {
        this.configList = res.data || []
      }).catch(error => this.$modal.msgError(zycckErrorMessage(error))).finally(() => { this.loading = false })
    },
    categoryName(category) {
      const item = this.categoryOptions.find(i => i.value === category)
      return item ? item.label : '未分类'
    },
    portraitEnabled(row) {
      return row && (row.participatePortrait === true || row.participatePortrait === 1 || String(row.participatePortrait || '1') === '1')
    },
    openDialog(row) {
      this.form = row ? { ...row } : {
        category: 'choice',
        gameName: '',
        route: '',
        participatePortrait: '1',
        status: '0'
      }
      this.dialogVisible = true
    },
    submitConfig() {
      // 页面不再暴露游戏类型；新增配置默认归属于当前 sszctop 游戏，历史编辑数据保留原编码。
      if (!this.form.gameType) this.form.gameType = 'sszctop'
      if (this.form.gameType === 'zycck') this.form.route = 'zycck'
      if (this.form.participatePortrait == null || this.form.participatePortrait === '') this.form.participatePortrait = '1'
      saveGameConfig(this.form).then(() => {
        this.$message.success('保存成功')
        this.dialogVisible = false
        this.getList()
      }).catch(error => this.$modal.msgError(zycckErrorMessage(error)))
    },
    removeConfig(row) {
      this.$confirm('确认删除该游戏配置？', '提示').then(() => {
        delGameConfig(row.configId).then(() => {
          this.$message.success('删除成功')
          this.getList()
        }).catch(error => this.$modal.msgError(zycckErrorMessage(error)))
      }).catch(() => {})
    }
  }
}
</script>
