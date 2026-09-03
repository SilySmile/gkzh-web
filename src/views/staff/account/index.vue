<template>
  <div class="app-container">
    <el-form :inline="true" size="small"
      ><el-button type="primary" icon="el-icon-plus" @click="openAdd"
        >新增工作人员</el-button
      ><el-button
        native-type="button"
        icon="el-icon-refresh"
        @click.prevent="load"
        >刷新</el-button
      ></el-form
    >
    <el-table v-loading="loading" :data="list"
      ><el-table-column type="index" label="序号" width="70" /><el-table-column
        prop="staffName"
        label="姓名"
      /><el-table-column prop="userName" label="登录账号" /><el-table-column
        prop="schoolName"
        label="所属学校"
      /><el-table-column label="核销权限"
        ><template slot-scope="s"
          ><el-tag :type="s.row.canRedeem === 1 ? 'success' : 'info'">{{
            s.row.canRedeem === 1 ? "允许核销" : "禁止核销"
          }}</el-tag></template
        ></el-table-column
      ><el-table-column prop="status" label="状态"
        ><template slot-scope="s"
          ><el-tag :type="s.row.status === '0' ? 'success' : 'info'">{{
            s.row.status === "0" ? "正常" : "停用"
          }}</el-tag></template
        ></el-table-column
      ><el-table-column label="操作" width="230"
        ><template slot-scope="s"
          ><el-button type="text" @click="openEdit(s.row)">编辑</el-button
          ><el-button type="text" @click="reset(s.row)"
            >重置密码</el-button
          ></template
        ></el-table-column
      ></el-table
    >
    <el-dialog
      :title="form.staffId ? '编辑工作人员' : '新增工作人员'"
      :visible.sync="visible"
      width="460px"
      ><el-form :model="form" label-width="90px"
        ><el-form-item label="姓名"
          ><el-input v-model="form.staffName" /></el-form-item
        ><el-form-item label="登录账号"
          ><el-input
            v-model="form.userName"
            :disabled="!!form.staffId" /></el-form-item
        ><el-form-item v-if="!form.staffId" label="初始密码"
          ><el-input v-model="form.password" show-password /></el-form-item
        ><el-form-item label="所属学校"
          ><el-select
            v-model="form.schoolId"
            filterable
            clearable
            placeholder="请选择学校"
            style="width: 100%"
            ><el-option
              v-for="school in schools"
              :key="school.schoolId"
              :label="school.title"
              :value="school.schoolId" /></el-select></el-form-item
        ><el-form-item label="核销权限"
          ><el-switch
            v-model="form.canRedeem"
            :active-value="1"
            :inactive-value="0" /></el-form-item
        ><el-form-item label="状态"
          ><el-select v-model="form.status"
            ><el-option label="正常" value="0" /><el-option
              label="停用"
              value="1" /></el-select></el-form-item></el-form
      ><span slot="footer"
        ><el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button></span
      >
    </el-dialog>
  </div>
</template>
<script>
import {
  listStaff,
  addStaff,
  updateStaff,
  resetStaffPassword,
} from "@/api/staff/account";
import { listSchool } from "@/api/school/school";
export default {
  data: () => ({
    loading: false,
    list: [],
    schools: [],
    visible: false,
    form: {},
  }),
  created() {
    this.load();
    this.loadSchools();
  },
  methods: {
    load() {
      if (this.loading) return;
      this.loading = true;
      return listStaff()
        .then((r) => {
          this.list = (r && r.rows) || [];
        })
        .catch(() => {
          this.list = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    loadSchools() {
      listSchool({ status: "0" }).then((r) => {
        this.schools = r.rows || [];
      });
    },
    openAdd() {
      this.form = { status: "0", canRedeem: 1 };
      this.visible = true;
    },
    openEdit(row) {
      this.form = Object.assign({ canRedeem: 0 }, row);
      this.form.canRedeem = Number(this.form.canRedeem) || 0;
      this.visible = true;
    },
    save() {
      const api = this.form.staffId ? updateStaff : addStaff;
      api(this.form).then(() => {
        this.$modal.msgSuccess("保存成功");
        this.visible = false;
        return this.load();
      });
    },
    reset(row) {
      this.$prompt("请输入新密码", "重置密码", { inputType: "password" })
        .then(({ value }) => resetStaffPassword(row.staffId, value))
        .then(() => this.$modal.msgSuccess("密码已重置"));
    },
  },
};
</script>
