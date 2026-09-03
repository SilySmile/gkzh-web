<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryForm" size="small"
                 :inline="true" v-show="showSearch" label-width="68px">
            <el-form-item label="问卷标题" prop="title">
                <el-input
                    v-model="queryParams.title"
                    placeholder="请输入问卷标题"
                    clearable
                    @keyup.enter.native="handleQuery"
                />
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="请选择状态"
                           clearable>
                    <el-option
                        v-for="dict in dict.type.sys_normal_disable"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                    />
                </el-select>
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
                    type="primary"
                    plain
                    icon="el-icon-plus"
                    size="mini"
                    @click="handleAdd"
                    v-hasPermi="['wjdc:survey:add']"
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
                    v-hasPermi="['wjdc:survey:edit']"
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
                    v-hasPermi="['wjdc:survey:remove']"
                >删除
                </el-button>
            </el-col>
            <el-col :span="1.5" style="display: none;">
                <el-button
                    type="warning"
                    plain
                    icon="el-icon-download"
                    size="mini"
                    @click="handleExport"
                    v-hasPermi="['wjdc:survey:export']"
                >导出
                </el-button>
            </el-col>
            <el-col :span="1.5" style="display: none;">
                <el-button
                    type="info"
                    plain
                    icon="el-icon-document"
                    size="mini"
                    @click="handleExportDetail"
                    v-hasPermi="['wjdc:survey:export']"
                >完整导出
                </el-button>
            </el-col>
            <right-toolbar :showSearch.sync="showSearch"
                           @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="surveyList"
                  @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="编号" align="center" prop="id"/>
            <el-table-column label="问卷标题" align="center" prop="title"/>
            <el-table-column label="问卷说明" align="center"
                             prop="description"/>
            <el-table-column label="状态" align="center" prop="status">
                <template slot-scope="scope">
                    <dict-tag :options="dict.type.sys_normal_disable"
                              :value="scope.row.status"/>
                </template>
            </el-table-column>
            <el-table-column label="开始时间" align="center" prop="startTime"
                             width="180">
                <template slot-scope="scope">
                    <span>{{
                            parseTime(scope.row.startTime, '{y}-{m}-{d}')
                        }}</span>
                </template>
            </el-table-column>
            <el-table-column label="结束时间" align="center" prop="endTime"
                             width="180">
                <template slot-scope="scope">
                    <span>{{
                            parseTime(scope.row.endTime, '{y}-{m}-{d}')
                        }}</span>
                </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createdAt"
                             width="180">
                <template slot-scope="scope">
                    <span>{{
                            parseTime(scope.row.createdAt, '{y}-{m}-{d}')
                        }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center"
                             class-name="small-padding fixed-width">
                <template slot-scope="scope">
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-document-copy"
                        @click="handleCopy(scope.row)"
                        v-hasPermi="['wjdc:survey:add']"
                    >复制
                    </el-button>
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-edit"
                        @click="handleUpdate(scope.row)"
                        v-hasPermi="['wjdc:survey:edit']"
                    >修改
                    </el-button>
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-setting"
                        @click="handleQuestions(scope.row)"
                        v-hasPermi="['wjdc:survey:edit']"
                    >问题
                    </el-button>
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-delete"
                        @click="handleDelete(scope.row)"
                        v-hasPermi="['wjdc:survey:remove']"
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

        <!-- 添加或修改问卷管理对话框 -->
        <el-dialog :title="title" :visible.sync="open" width="500px"
                   append-to-body>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="问卷标题" prop="title">
                    <el-input v-model="form.title"
                              placeholder="请输入问卷标题"/>
                </el-form-item>
                <el-form-item label="问卷说明" prop="description">
                    <el-input v-model="form.description" type="textarea"
                              placeholder="请输入内容"/>
                </el-form-item>
                <el-form-item label="开始时间" prop="startTime">
                    <el-date-picker clearable
                                    v-model="form.startTime"
                                    type="date"
                                    value-format="yyyy-MM-dd"
                                    placeholder="请选择开始时间">
                    </el-date-picker>
                </el-form-item>
                <el-form-item label="结束时间" prop="endTime">
                    <el-date-picker clearable
                                    v-model="form.endTime"
                                    type="date"
                                    value-format="yyyy-MM-dd"
                                    placeholder="请选择结束时间">
                    </el-date-picker>
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
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button type="primary" @click="submitForm">确 定</el-button>
                <el-button @click="cancel">取 消</el-button>
            </div>
        </el-dialog>

        <!-- 问题管理对话框 -->
        <el-dialog title="问题管理" :visible.sync="questionsOpen" width="1000px"
                   append-to-body>
            <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                    <el-button
                        type="primary"
                        plain
                        icon="el-icon-plus"
                        size="mini"
                        @click="handleAddQuestion"
                    >新增问题
                    </el-button>
                </el-col>
            </el-row>

            <el-table v-loading="questionsLoading" :data="questionsList">
                <el-table-column label="排序" align="center" prop="sortOrder"
                                 width="100">
                    <template slot-scope="scope">
                        <el-input
                            v-model.number="scope.row.sortOrder"
                            type="number"
                            size="mini"
                            :min="1"              style="width: 60px;"
                            @blur="markQuestionAsModified(scope.row)">
                        </el-input>
                    </template>
                </el-table-column>
                <el-table-column label="问题标题" align="center"
                                 prop="questionTitle">
                    <template slot-scope="scope">
                        <el-input v-model="scope.row.questionTitle"
                                  placeholder="请输入问题标题"
                                  @blur="markQuestionAsModified(scope.row)"></el-input>
                    </template>
                </el-table-column>
                <el-table-column label="问题类型" align="center"
                                 prop="questionType" width="140">
                    <template slot-scope="scope">
                        <el-select v-model="scope.row.questionType"
                                   placeholder="请选择"
                                   @change="markQuestionAsModified(scope.row)">
                            <el-option label="单选题" value="1"></el-option>
                            <el-option label="多选题" value="2"></el-option>
                            <el-option label="填空题" value="3"></el-option>
                            <el-option label="打分题" value="4"></el-option>
                            <el-option label="选项打分题" value="5"></el-option>
                        </el-select>
                        <!-- 打分题分值范围设置 -->
                        <div v-if="scope.row.questionType === '4' || scope.row.questionType === '5'" style="margin-top: 5px;">
                            <el-input
                                v-model="scope.row.scoreRange"
                                placeholder="分值范围(如:1-9)"
                                size="mini"
                                @blur="markQuestionAsModified(scope.row)">
                            </el-input>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="是否必填" align="center" prop="required"
                                 width="120">
                    <template slot-scope="scope">
                        <el-switch
                            v-model="scope.row.required"
                            active-value="1"
                            inactive-value="0"
                            @change="markQuestionAsModified(scope.row)">
                        </el-switch>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center"
                                 class-name="small-padding fixed-width"
                                 width="220">
                    <template slot-scope="scope">
                        <el-button
                            size="small"
                            round
                            type="primary"
                            @click="saveSingleQuestion(scope.row)"
                            v-if="!scope.row.saved"
                        >保存
                        </el-button>
                        <el-button
                            size="mini"
                            type="text"
                            icon="el-icon-setting"
                            @click="handleQuestionOptions(scope.row)"
                            v-if="['1', '2','5'].includes(scope.row.questionType)"
                        >选项
                        </el-button>
                        <el-button
                            size="mini"
                            type="text"
                            icon="el-icon-delete"
                            @click="handleDeleteQuestion(scope.row)"
                        >删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div slot="footer" class="dialog-footer">
                <el-button @click="questionsOpen = false">关 闭</el-button>
            </div>
        </el-dialog>

        <!-- 选项设置对话框 -->
        <el-dialog title="选项设置" :visible.sync="optionsOpen" width="800px"
                   append-to-body>
            <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                    <el-button
                        type="primary"
                        plain
                        icon="el-icon-plus"
                        size="mini"
                        @click="handleAddOption"
                    >新增选项
                    </el-button>
                </el-col>
            </el-row>

            <el-table v-loading="optionsLoading" :data="optionsList">
                <el-table-column label="排序" align="center" prop="sortOrder"
                                 width="100">
                    <template slot-scope="scope">
                        <el-input
                            v-model.number="scope.row.sortOrder"
                            type="number"
                            size="mini"
                            :min="1"
                            style="width: 60px;"
                            @blur="handleSortChange(scope.row)">
                        </el-input>
                    </template>
                </el-table-column>
                <el-table-column label="选项内容" align="center"
                                 prop="optionText">
                    <template slot-scope="scope">
                        <el-input v-model="scope.row.optionText"
                                  placeholder="请输入选项内容"
                                  @blur="handleOptionChange(scope.row)"></el-input>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center"
                                 class-name="small-padding fixed-width"
                                 width="120">
                    <template slot-scope="scope">
                        <el-button
                            size="mini"
                            type="text"
                            icon="el-icon-delete"
                            @click="handleDeleteOption(scope.row)"
                        >删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div slot="footer" class="dialog-footer">
                <el-button @click="optionsOpen = false">关 闭</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import {
    listSurvey,
    getSurvey,
    delSurvey,
    addSurvey,
    updateSurvey,
    copySurvey
} from "@/api/wjdc/survey"
import {
    getQuestionsBySurveyId,
    addQuestion,
    updateQuestion,
    delQuestion
} from "@/api/wjdc/question"
import {
    getOptionsByQuestionId,
    addOption,
    updateOption,
    delOption
} from "@/api/wjdc/option"

export default {
    name: "Survey",
    dicts: ['sys_normal_disable'],
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
            // 问卷管理表格数据
            surveyList: [],
            // 弹出层标题
            title: "",
            // 是否显示弹出层
            open: false,
            // 查询参数
            queryParams: {
                pageNum: 1,
                pageSize: 10,
                title: null,
                status: null,
            },
            // 表单参数
            form: {},
            // 表单校验
            rules: {
                title: [
                    {
                        required: true,
                        message: "问卷标题不能为空",
                        trigger: "blur"
                    }
                ],
            },
            // 问题管理相关
            questionsOpen: false,
            questionsLoading: false,
            questionsList: [],
            currentSurveyId: null,
            // 选项设置相关
            optionsOpen: false,
            optionsLoading: false,
            optionsList: [],
            currentQuestionId: null,
            modifiedQuestions: new Set()
        }
    },
    created() {
        this.getList()
    },
    methods: {
        /** 查询问卷管理列表 */
        getList() {
            this.loading = true
            listSurvey(this.queryParams).then(response => {
                this.surveyList = response.rows
                this.total = response.total
                this.loading = false
            })
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
                title: null,
                description: null,
                status: "1",
                startTime: null,
                endTime: null
            }
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
            this.open = true
            this.title = "添加问卷管理"
        },
        /** 修改按钮操作 */
        handleUpdate(row) {
            this.reset()
            const id = row.id || this.ids
            getSurvey(id).then(response => {
                this.form = response.data
                this.open = true
                this.title = "修改问卷管理"
            })
        },
        /** 复制问卷操作 */
        handleCopy(row) {
            this.$modal.confirm(`确定要复制问卷"${row.title}"吗？`).then(() => {
                return copySurvey(row.id)
            }).then(response => {
                this.$modal.msgSuccess("复制成功")
                this.getList()
            }).catch(() => {})
        },
        /** 提交按钮 */
        submitForm() {
            this.$refs["form"].validate(valid => {
                if (valid) {
                    if (this.form.id != null) {
                        updateSurvey(this.form).then(response => {
                            this.$modal.msgSuccess("修改成功")
                            this.open = false
                            this.getList()
                        })
                    } else {
                        addSurvey(this.form).then(response => {
                            this.$modal.msgSuccess("新增成功")
                            this.open = false
                            this.getList()
                        })
                    }
                }
            })
        },
        /** 删除按钮操作 */
        handleDelete(row) {
            const ids = row.id || this.ids
            this.$modal.confirm('是否确认删除问卷管理编号为"' + ids + '"的数据项？').then(function () {
                return delSurvey(ids)
            }).then(() => {
                this.getList()
                this.$modal.msgSuccess("删除成功")
            }).catch(() => {
            })
        },
        /** 导出按钮操作 */
        handleExport() {
            this.download('wjdc/survey/export', {
                ...this.queryParams
            }, `问卷列表${new Date().getTime()}.xlsx`)
        },
        /** 完整导出按钮操作 */
        handleExportDetail() {
            this.download('wjdc/survey/exportDetail', {
                ...this.queryParams
            }, `survey_detail_${new Date().getTime()}.xlsx`)
        },
        // 问题管理相关方法
        handleQuestions(row) {
            this.currentSurveyId = row.id
            this.questionsOpen = true
            this.questionsLoading = true
            // 调用API获取问题列表
            getQuestionsBySurveyId(row.id).then(response => {
                this.questionsList = response.data || []
                this.questionsLoading = false
            }).catch(() => {
                this.questionsLoading = false
            })
        },

        saveSingleQuestion(row) {
            if (!row.questionTitle || !row.questionTitle.trim()) {
                this.$modal.msgWarning("问题标题不能为空");
                return;
            }

            if (row.saving) {
                this.$modal.msgWarning("该问题正在保存中，请勿重复点击");
                return;
            }

            row.saving = true;

            if (!row.id) {
                // 新增问题
                addQuestion(row).then(response => {
                    row.id = response.data;
                    row.saved = true; // 标记为已保存
                    this.$modal.msgSuccess("问题保存成功");
                    // 从修改集合中移除（如果存在）
                    this.modifiedQuestions.delete(row);
                }).catch(() => {
                    this.$modal.msgError("问题保存失败");
                }).finally(() => {
                    row.saving = false;
                });
            } else {
                // 更新问题
                updateQuestion(row).then(response => {
                    row.saved = true; // 标记为已保存
                    this.$modal.msgSuccess("问题更新成功");
                    // 从修改集合中移除（如果存在）
                    this.modifiedQuestions.delete(row);
                }).catch(error => {
                    console.error("更新问题失败:", error);
                    this.$modal.msgError("问题更新失败");
                }).finally(() => {
                    row.saving = false;
                });
            }
        },

        // 修改 markQuestionAsModified 方法
        markQuestionAsModified(row) {
            // 标记问题为已修改
            this.modifiedQuestions.add(row);
            // 清除已保存标记
            row.saved = false;
        },

        // 修改 handleAddQuestion 方法
        handleAddQuestion() {
            const newQuestion = {
                id: null,
                surveyId: this.currentSurveyId,
                questionTitle: '',
                questionType: '1',
                required: '0',
                sortOrder: this.questionsList.length + 1,
                scoreRange: '',
                saved: false, // 添加保存状态标记
                saving: false // 添加保存中状态标记
            };
            this.questionsList.push(newQuestion);
            // 新添加的问题默认标记为已修改
            this.markQuestionAsModified(newQuestion);
        },

        // 修改 handleDeleteQuestion 方法
        handleDeleteQuestion(row) {
            this.$modal.confirm('是否确认删除该问题？').then(() => {
                if (row.id) {
                    // 删除已存在的问题
                    delQuestion(row.id).then(() => {
                        const index = this.questionsList.findIndex(item => item.id === row.id);
                        if (index > -1) {
                            this.questionsList.splice(index, 1);
                            // 从修改集合中移除
                            this.modifiedQuestions.delete(row);
                            // 重新排序
                            this.questionsList.forEach((item, idx) => {
                                item.sortOrder = idx + 1;
                            });
                        }
                        this.$modal.msgSuccess("删除成功");
                    }).catch(() => {
                        this.$modal.msgError("删除失败");
                    });
                } else {
                    // 删除未保存的问题
                    const index = this.questionsList.findIndex(item => item === row);
                    if (index > -1) {
                        this.questionsList.splice(index, 1);
                        // 从修改集合中移除
                        this.modifiedQuestions.delete(row);
                        // 重新排序
                        this.questionsList.forEach((item, idx) => {
                            item.sortOrder = idx + 1;
                        });
                    }
                    this.$modal.msgSuccess("删除成功");
                }
            }).catch(() => {
            });
        },


        handleQuestionOptions(row) {
            this.currentQuestionId = row.id
            this.optionsOpen = true
            this.optionsLoading = true
            // 调用API获取选项列表
            getOptionsByQuestionId(row.id).then(response => {
                this.optionsList = response.data || []
                this.optionsLoading = false
            }).catch(() => {
                this.optionsLoading = false
            })
        },
        // 选项设置相关方法
        handleAddOption() {
            const newOption = {
                id: null,
                questionId: this.currentQuestionId,
                optionText: '',
                sortOrder: this.optionsList.length + 1
            }
            this.optionsList.push(newOption)
        },
        handleSortChange(row) {
            if (row.id) {
                // 更新已存在的选项
                updateOption(row).then(response => {
                    this.$modal.msgSuccess("排序更新成功")
                }).catch(() => {
                    this.$modal.msgError("排序更新失败")
                })
            }
        },
        handleOptionChange(row) {
            if (row.id) {
                // 更新已存在的选项
                updateOption(row).then(response => {
                    this.$modal.msgSuccess("选项更新成功")
                }).catch(() => {
                    this.$modal.msgError("选项更新失败")
                })
            } else if (row.optionText.trim()) {
                // 新增选项
                addOption(row).then(response => {
                    row.id = response.data
                    this.$modal.msgSuccess("选项添加成功")
                }).catch(() => {
                    this.$modal.msgError("选项添加失败")
                })
            }
        },
        handleDeleteOption(row) {
            this.$modal.confirm('是否确认删除该选项？').then(() => {
                if (row.id) {
                    // 删除已存在的选项
                    delOption(row.id).then(() => {
                        const index = this.optionsList.findIndex(item => item.id === row.id)
                        if (index > -1) {
                            this.optionsList.splice(index, 1)
                            // 重新排序
                            this.optionsList.forEach((item, idx) => {
                                item.sortOrder = idx + 1
                            })
                        }
                        this.$modal.msgSuccess("删除成功")
                    }).catch(() => {
                        this.$modal.msgError("删除失败")
                    })
                } else {
                    // 删除未保存的选项
                    const index = this.optionsList.findIndex(item => item === row)
                    if (index > -1) {
                        this.optionsList.splice(index, 1)
                        // 重新排序
                        this.optionsList.forEach((item, idx) => {
                            item.sortOrder = idx + 1
                        })
                    }
                    this.$modal.msgSuccess("删除成功")
                }
            }).catch(() => {
            })
        }
    }
}
</script>
