<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch"
                 label-width="68px">
            <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                    <el-option
                        v-for="dict in dict.type.sys_normal_disable"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button
                    type="primary"
                    plain
                    icon="el-icon-plus"
                    size="mini"
                    @click="handleAdd"
                    v-hasPermi="['cyzs:question:add']"
                >新增
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="success"
                    plain
                    icon="el-icon-edit"
                    size="mini"
                    :disabled="single"
                    @click="handleUpdate"
                    v-hasPermi="['cyzs:question:edit']"
                >修改
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="danger"
                    plain
                    icon="el-icon-delete"
                    size="mini"
                    :disabled="multiple"
                    @click="handleDelete"
                    v-hasPermi="['cyzs:question:remove']"
                >删除
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="warning"
                    plain
                    icon="el-icon-download"
                    size="mini"
                    @click="handleExport"
                    v-hasPermi="['cyzs:question:export']"
                >导出
                </el-button>
            </el-col>
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="questionList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="ID" align="center" prop="id"/>
            <el-table-column label="题目内容" align="center" prop="questionText"/>
            <el-table-column label="类型" align="center" prop="status">
                <template slot-scope="scope">
                    <dict-tag :options="dict.type.cyzs_question_type" :value="scope.row.type"/>
                </template>
            </el-table-column>
            <el-table-column label="状态" align="center" prop="status">
                <template slot-scope="scope">
                    <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
                </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime"/>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
                <template slot-scope="scope">
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-edit"
                        @click="handleUpdate(scope.row)"
                        v-hasPermi="['cyzs:question:edit']"
                    >修改
                    </el-button>
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-delete"
                        @click="handleDelete(scope.row)"
                        v-hasPermi="['cyzs:question:remove']"
                    >删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <pagination
            v-show="total>0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
        />

        <!-- 添加或修改职场危机对话框 -->
        <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="题目内容" prop="questionText">
                    <el-input v-model="form.questionText" type="textarea" placeholder="请输入内容"/>
                </el-form-item>
                <el-form-item label="题目类型" prop="type">
                    <el-select v-model="form.type" placeholder="请选择题目类型" @change="handleTypeChange">
                        <el-option
                            v-for="dict in dict.type.cyzs_question_type"
                            :key="dict.value"
                            :label="dict.label"
                            :value="dict.value"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="题目选项" prop="options">
                    <div
                        v-for="(option, index) in optionList"
                        :key="option.key"
                        class="option-item"
                        style="margin-bottom: 15px; display: flex;"
                    >
                        <span style="font-weight: bold; width: 20px; padding-top: 7px;">{{ option.key }}.</span>
                        <el-input
                            type="textarea"
                            :rows="2"
                            v-model="option.value"
                            :placeholder="`请输入选项${option.key}内容`"      style="width: 300px; margin: 0 10px;"
                        />
                        <div style="padding-top: 7px;">
                            <el-checkbox
                                v-model="option.isCorrect"
                                :disabled="!isMultipleChoice && getCorrectCount() >= 1 && !option.isCorrect"
                            >
                                正确答案
                            </el-checkbox>
                        </div>
                    </div>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="form.status">
                        <el-radio
                            v-for="dict in dict.type.sys_normal_disable"
                            :key="dict.value"
                            :label="dict.value"
                        >{{ dict.label }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"/>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button type="primary" @click="submitForm">确 定</el-button>
                <el-button @click="cancel">取 消</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import {listQuestion, getQuestion, delQuestion, addQuestion, updateQuestion} from "@/api/cyzs/question"

export default {
    name: "Question",
    dicts: ['sys_normal_disable', 'cyzs_question_type'],
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
            // 职场危机表格数据
            questionList: [],
            // 弹出层标题
            title: "",
            // 是否显示弹出层
            open: false,
            // 查询参数
            queryParams: {
                pageNum: 1,
                pageSize: 10,
                questionText: null,
                status: null,
            },
            optionList: [
                { key: 'A', value: '', isCorrect: false },
                { key: 'B', value: '', isCorrect: false },
                { key: 'C', value: '', isCorrect: false },
                { key: 'D', value: '', isCorrect: false }
            ],
            // 表单参数
            form: {},
            // 表单校验
            rules: {
                questionText: [
                    {required: true, message: "题目内容不能为空", trigger: "blur"}
                ],
                type: [ // 添加题目类型的验证规则
                    {required: true, message: "题目类型不能为空", trigger: "change"}
                ],
                'optionList.0.value': [
                    { required: true, message: "选项A内容不能为空", trigger: "blur" }
                ],
                'optionList.1.value': [
                    { required: true, message: "选项B内容不能为空", trigger: "blur" }
                ],
                'optionList.2.value': [
                    { required: true, message: "选项C内容不能为空", trigger: "blur" }
                ],
                'optionList.3.value': [
                    { required: true, message: "选项D内容不能为空", trigger: "blur" }
                ],
                status: [
                    {required: true, message: "状态不能为空", trigger: "change"}
                ],
            }
        }
    },
    computed: {
        isMultipleChoice() {
            return this.form.type === '2'; // 根据实际的多选题类型值调整
        }
    },
    created() {
        this.getList()
    },
    methods: {
        /** 查询职场危机列表 */
        getList() {
            this.loading = true
            listQuestion(this.queryParams).then(response => {
                this.questionList = response.rows
                this.total = response.total
                this.loading = false
            })
        },
        /** 设置题目类型默认值 */
        setDefault() {
            if (this.dict.type.cyzs_question_type && this.dict.type.cyzs_question_type.length > 0) {
                this.form.type = this.dict.type.cyzs_question_type[0].value;
            }
            if (this.dict.type.sys_normal_disable && this.dict.type.sys_normal_disable.length > 0) {
                this.form.status = this.dict.type.sys_normal_disable[0].value;
            }
        },
        // 取消按钮
        cancel() {
            this.open = false
            this.reset()
        },
        // 表单重置
        reset() {
            this.form = {
                id: null,
                questionText: null,
                type: null,
                optionA: null,
                optionB: null,
                optionC: null,
                optionD: null,
                correctOptionKey: null,
                status: null,
                createBy: null,
                createTime: null,
                updateBy: null,
                updateTime: null,
                remark: null
            }
            this.optionList = [
                { key: 'A', value: '', isCorrect: false },
                { key: 'B', value: '', isCorrect: false },
                { key: 'C', value: '', isCorrect: false },
                { key: 'D', value: '', isCorrect: false }
            ]
            this.resetForm("form")
        },
        /** 搜索按钮操作 */
        handleQuery() {
            this.queryParams.pageNum = 1
            this.getList()
        },
        /** 重置按钮操作 */
        resetQuery() {
            this.resetForm("queryForm")
            this.handleQuery()
        },
        // 多选框选中数据
        handleSelectionChange(selection) {
            this.ids = selection.map(item => item.id)
            this.single = selection.length !== 1
            this.multiple = !selection.length
        },
        /** 新增按钮操作 */
        handleAdd() {
            this.reset()
            this.setDefault()
            this.open = true
            this.title = "添加问题"
        },
        /** 修改按钮操作 */
        handleUpdate(row) {
            this.reset()
            const id = row.id || this.ids
            getQuestion(id).then(response => {
                this.form = response.data
                // 设置选项列表
                this.optionList = [
                    { key: 'A', value: response.data.optionA || '', isCorrect: (response.data.correctOptionKey || '').split(',').includes('A') },
                    { key: 'B', value: response.data.optionB || '', isCorrect: (response.data.correctOptionKey || '').split(',').includes('B') },
                    { key: 'C', value: response.data.optionC || '', isCorrect: (response.data.correctOptionKey || '').split(',').includes('C') },
                    { key: 'D', value: response.data.optionD || '', isCorrect: (response.data.correctOptionKey || '').split(',').includes('D') }
                ];

                // 设置题目类型
                this.form.type = response.data.type;
                this.open = true
                this.title = "修改问题"
            })
        },
        getCorrectCount() {
            return this.optionList.filter(option => option.isCorrect).length;
        },

        handleTypeChange(type) {
            // 切换题目类型时重置正确答案
            this.optionList.forEach(option => {
                option.isCorrect = false;
            });
        },
        // 提交前处理数据
        prepareSubmitData() {
            // 验证选项内容
            for (let i = 0; i < this.optionList.length; i++) {
                if (!this.optionList[i].value) {
                    this.$message.error(`选项${this.optionList[i].key}内容不能为空`);
                    return false;
                }
            }

            // 验证正确选项
            const correctOptions = this.optionList
                .filter(option => option.isCorrect)
                .map(option => option.key);

            if (correctOptions.length === 0) {
                this.$message.error("至少需要选择一个正确答案");
                return false;
            }

            // 设置各选项内容
            this.form.optionA = this.optionList[0].value;
            this.form.optionB = this.optionList[1].value;
            this.form.optionC = this.optionList[2].value;
            this.form.optionD = this.optionList[3].value;

            // 设置正确答案
            this.form.correctOptionKey = correctOptions.join(',');

            return true;
        },
        /** 提交按钮 */
        submitForm() {
            this.$refs["form"].validate(valid => {
                if (valid) {
                    // 执行数据准备和验证
                    if (this.prepareSubmitData()) {
                        if (this.form.id != null) {
                            updateQuestion(this.form).then(response => {
                                this.$modal.msgSuccess("修改成功")
                                this.open = false
                                this.getList()
                            })
                        } else {
                            addQuestion(this.form).then(response => {
                                this.$modal.msgSuccess("新增成功")
                                this.open = false
                                this.getList()
                            })
                        }
                    }
                }
            })
        },
        /** 删除按钮操作 */
        handleDelete(row) {
            const ids = row.id || this.ids
            this.$modal.confirm('是否确认删除职场危机编号为"' + ids + '"的数据项？').then(function () {
                return delQuestion(ids)
            }).then(() => {
                this.getList()
                this.$modal.msgSuccess("删除成功")
            }).catch(() => {
            })
        },
        /** 导出按钮操作 */
        handleExport() {
            this.download('cyzs/question/export', {
                ...this.queryParams
            }, `创业知识问题_${new Date().getTime()}.xlsx`)
        }
    }
}
</script>
