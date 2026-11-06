<template>
  <div class="app-container">
    <el-card shadow="never" class="page-tip">
      <div class="tip-title">汉印云打印机</div>
      <div class="tip-text">先点击“同步云端设备”获取汉印账号下已绑定的设备，设备在线且本地启用后，学生报告页才会展示该打印机。</div>
    </el-card>

    <div class="toolbar">
      <el-button v-hasPermi="['zycck:printer:sync']" type="primary" icon="el-icon-refresh" :loading="syncing" @click="sync">同步云端设备</el-button>
      <el-button v-hasPermi="['zycck:printer:bind']" icon="el-icon-plus" @click="openBind">手动绑定设备</el-button>
      <el-button icon="el-icon-refresh-right" :loading="loading" @click="load">刷新列表</el-button>
      <span class="toolbar-note">共 {{ printers.length }} 台</span>
    </div>

    <el-table v-loading="loading" :data="printers" border stripe>
      <el-table-column prop="printerName" label="业务名称" min-width="150">
        <template slot-scope="scope">{{ scope.row.printerName || scope.row.cloudName || scope.row.equipmentSn }}</template>
      </el-table-column>
      <el-table-column prop="equipmentSn" label="设备序列号" min-width="180" />
      <el-table-column prop="modelName" label="型号" width="130">
        <template slot-scope="scope">{{ scope.row.modelName || '-' }}</template>
      </el-table-column>
      <el-table-column label="在线状态" width="110" align="center">
        <template slot-scope="scope"><el-tag :type="statusType(scope.row)">{{ scope.row.statusText || '未知' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="打印资格" width="110" align="center">
        <template slot-scope="scope"><el-tag :type="scope.row.canPrint ? 'success' : 'info'">{{ scope.row.canPrint ? '可打印' : '不可打印' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="最近同步" width="170" align="center">
        <template slot-scope="scope">{{ formatDate(scope.row.lastStatusSyncTime || scope.row.lastSyncTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right" align="center">
        <template slot-scope="scope">
          <el-button v-hasPermi="['zycck:printer:edit']" type="text" size="small" :loading="statusLoading === scope.row.printerId" @click="refreshStatus(scope.row)">刷新状态</el-button>
          <el-button v-hasPermi="['zycck:printer:edit']" type="text" size="small" @click="rename(scope.row)">改名称</el-button>
          <el-button v-hasPermi="['zycck:printer:remove']" type="text" size="small" class="danger-text" @click="unbind(scope.row)">解绑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="绑定汉印打印机" :visible.sync="bindVisible" width="480px" @closed="resetBind">
      <el-form ref="bindForm" :model="bindForm" :rules="bindRules" label-width="110px">
        <el-form-item label="设备序列号" prop="equipmentSn"><el-input v-model.trim="bindForm.equipmentSn" placeholder="请输入 equipment_sn" /></el-form-item>
        <el-form-item label="设备密钥" prop="equipmentSecret"><el-input v-model.trim="bindForm.equipmentSecret" show-password placeholder="如平台要求请输入" /></el-form-item>
        <el-form-item label="业务名称" prop="printerName"><el-input v-model.trim="bindForm.printerName" maxlength="50" placeholder="例如：报告打印机1" /></el-form-item>
      </el-form>
      <div slot="footer"><el-button @click="bindVisible = false">取消</el-button><el-button type="primary" :loading="binding" @click="bind">确定绑定</el-button></div>
    </el-dialog>
  </div>
</template>

<script>
import { listPrinters, syncPrinters, bindPrinter, renamePrinter, refreshPrinterStatus, unbindPrinter } from '@/api/zycck'
import { zycckErrorMessage } from '@/api/zycck'

export default {
  name: 'ZycckPrinters',
  data() {
    return {
      printers: [], loading: false, syncing: false, binding: false, statusLoading: null, bindVisible: false,
      bindForm: { equipmentSn: '', equipmentSecret: '', printerName: '' },
      bindRules: { equipmentSn: [{ required: true, message: '请输入设备序列号', trigger: 'blur' }] }
    }
  },
  created() { this.load() },
  methods: {
    unwrap(res) { return (res && res.data) || res || [] },
    load() {
      this.loading = true
      listPrinters().then(res => { this.printers = this.unwrap(res) }).catch(e => this.$modal.msgError(zycckErrorMessage(e))).finally(() => { this.loading = false })
    },
    sync() {
      this.syncing = true
      syncPrinters().then(() => { this.$modal.msgSuccess('云端设备同步成功'); this.load() }).catch(e => this.$modal.msgError(zycckErrorMessage(e))).finally(() => { this.syncing = false })
    },
    openBind() { this.bindVisible = true },
    resetBind() { this.bindForm = { equipmentSn: '', equipmentSecret: '', printerName: '' }; if (this.$refs.bindForm) this.$refs.bindForm.resetFields() },
    bind() {
      this.$refs.bindForm.validate(valid => {
        if (!valid) return
        this.binding = true
        bindPrinter(this.bindForm).then(() => { this.$modal.msgSuccess('打印机绑定成功'); this.bindVisible = false; this.load() }).catch(e => this.$modal.msgError(zycckErrorMessage(e))).finally(() => { this.binding = false })
      })
    },
    refreshStatus(row) {
      this.statusLoading = row.printerId
      refreshPrinterStatus(row.printerId).then(res => { const updated = this.unwrap(res); const index = this.printers.findIndex(item => item.printerId === updated.printerId); if (index >= 0) this.$set(this.printers, index, updated); this.$modal.msgSuccess('状态已刷新') }).catch(e => this.$modal.msgError(zycckErrorMessage(e))).finally(() => { this.statusLoading = null })
    },
    rename(row) {
      this.$prompt('请输入业务名称', '修改打印机名称', { inputValue: row.printerName || row.cloudName || row.equipmentSn, inputValidator: value => value && value.trim() ? true : '名称不能为空' }).then(({ value }) => {
        return renamePrinter(row.printerId, value.trim())
      }).then(() => { this.$modal.msgSuccess('名称已更新'); this.load() }).catch(e => { if (e) this.$modal.msgError(zycckErrorMessage(e)) })
    },
    unbind(row) {
      this.$modal.confirm('解绑后该设备将不再提供给学生选择，但历史任务会保留，确认继续？').then(() => unbindPrinter(row.printerId)).then(() => { this.$modal.msgSuccess('打印机已解绑'); this.load() }).catch(e => { if (e) this.$modal.msgError(zycckErrorMessage(e)) })
    },
    statusType(row) { return Number(row.status) === 1 ? 'success' : Number(row.status) > 1 ? 'warning' : 'info' },
    formatDate(value) { return value ? this.parseTime(value, '{y}-{m}-{d} {h}:{i}:{s}') : '-' }
  }
}
</script>

<style scoped>
.page-tip { margin-bottom: 16px; }
.tip-title { font-weight: 600; margin-bottom: 6px; }
.tip-text, .toolbar-note { color: #909399; font-size: 13px; }
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.toolbar-note { margin-left: auto; }
.danger-text { color: #f56c6c; }
</style>
