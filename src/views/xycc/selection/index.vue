<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryForm" size="small"
                 :inline="true" v-show="showSearch" label-width="68px">
            <el-form-item label="用户名" prop="userName">
                <el-input
                    v-model="queryParams.userName"
                    placeholder="请输入用户名"
                    clearable
                    @keyup.enter.native="handleQuery"
                    style="width: 150px"
                />
            </el-form-item>
            <el-form-item label="编码组合" prop="patternComboCode">
                <el-input
                    v-model="queryParams.patternComboCode"
                    placeholder='请输入如"RIA"'
                    clearable
                    @keyup.enter.native="handleQuery"
                    style="width: 150px"
                />
            </el-form-item>
            <el-form-item label="职业方向" prop="careerTitles">
                <el-input
                    v-model="queryParams.careerTitles"
                    placeholder='请输入如"工程师"'
                    clearable
                    @keyup.enter.native="handleQuery"
                />
            </el-form-item>
            <el-form-item label="工作环境偏好" prop="envTitles"
                          label-width="100px">
                <el-input
                    v-model="queryParams.envTitles"
                    placeholder='请输入如"工程现场"'
                    clearable
                    @keyup.enter.native="handleQuery"
                />
            </el-form-item>
            <el-form-item label="选择时间">
                <el-date-picker
                    v-model="daterangeCreatedAt"
                    style="width: 240px"
                    value-format="yyyy-MM-dd"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                ></el-date-picker>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini"
                           @click="handleQuery">搜索
                </el-button>
                <el-button icon="el-icon-refresh" size="mini"
                           @click="resetQuery">重置
                </el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button
                    type="warning"
                    plain
                    icon="el-icon-download"
                    size="mini"
                    @click="handleExport"
                    v-hasPermi="['xycc:selection:export']"
                >导出
                </el-button>
            </el-col>
            <right-toolbar :showSearch.sync="showSearch"
                           @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="selectionList"
                  @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="编号" align="center"
                             prop="userSelectionId"/>
            <el-table-column label="学名" align="center" prop="userName"/>
            <el-table-column label="姓名" align="center" prop="nickName"/>
            <el-table-column label="编码组合" align="center"
                             prop="patternComboCode"/>
            <el-table-column label="职业方向" align="center" prop="careerTitles"
                             :show-overflow-tooltip="true"/>
            <el-table-column label="工作环境偏好" align="center"
                             prop="envTitles" :show-overflow-tooltip="true"/>
            <el-table-column label="选择时间" align="center" prop="createdAt"
                             width="180"/>
        </el-table>

        <pagination
            v-show="total>0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
        />

    </div>
</template>

<script>
import {
    listSelection,
    getSelection,
    delSelection,
    addSelection,
    updateSelection
} from "@/api/xycc/selection"

export default {
    name: "Selection",
    data() {
        return {
            // 遮罩层
            loading: true,
            // 选中数组
            ids: [],
            // 非单个禁用
            single: true,
            // 非多个禁用
            multiple: true,
            // 显示搜索条件
            showSearch: true,
            // 总条数
            total: 0,
            // 用户记录表格数据
            selectionList: [],
            // 弹出层标题
            title: "",
            // 是否显示弹出层
            open: false,
            // 选择时间时间范围
            daterangeCreatedAt: [],
            // 查询参数
            queryParams: {
                pageNum: 1,
                pageSize: 10,
                userId: null,
                userName: null,
                patternComboCode: null,
                careerTitles: null,
                envTitles: null,
                createdAt: null
            },
            // 表单参数
            form: {},
            // 表单校验
            rules: {}
        }
    },
    created() {
        this.getList()
    },
    methods: {
        /** 查询用户记录列表 */
        getList() {
            this.loading = true
            this.queryParams.params = {}
            if (null != this.daterangeCreatedAt && '' != this.daterangeCreatedAt) {
                this.queryParams.params["beginCreatedAt"] = this.daterangeCreatedAt[0]
                this.queryParams.params["endCreatedAt"] = this.daterangeCreatedAt[1]
            }
            listSelection(this.queryParams).then(response => {
                this.selectionList = response.rows
                this.total = response.total
                this.loading = false
            })
        },

        /** 搜索按钮操作 */
        handleQuery() {
            this.queryParams.pageNum = 1
            this.getList()
        },
        /** 重置按钮操作 */
        resetQuery() {
            this.daterangeCreatedAt = []
            this.resetForm("queryForm")
            this.handleQuery()
        },
        // 多选框选中数据
        handleSelectionChange(selection) {
            this.ids = selection.map(item => item.userSelectionId)
            this.single = selection.length !== 1
            this.multiple = !selection.length
        },
        /** 导出按钮操作 */
        handleExport() {
            this.download('xycc/selection/export', {
                ...this.queryParams
            }, `心愿橱窗选择结果_${new Date().getTime()}.xlsx`)
        }
    }
}
</script>
