<template>
  <el-dialog
    title="配置参与人"
    :visible.sync="dialogVisible"
    width="55%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="participant-config-dialog"
  >
    <div class="participant-config-modern">
      <!-- 多级联动筛选器 -->
      <div class="filter-section">
        <el-form :model="filterForm" ref="filterForm" size="small" :inline="true" label-width="68px">
          <el-form-item label="学校" prop="schoolId">
            <el-select
              v-model="filterForm.schoolId"
              placeholder="请选择学校"
              clearable
              @change="handleSchoolChange"
              style="width: 200px"
            >
              <el-option
                v-for="school in schoolOptions"
                :key="school.schoolId"
                :label="school.title"
                :value="school.schoolId"
              />
            </el-select>
          </el-form-item>

          <!-- 动态显示院系选择（只有三级结构时才显示） -->
          <el-form-item v-if="showCollegeSelect" label="院系" prop="collegeId">
            <el-select
              v-model="filterForm.collegeId"
              placeholder="请选择院系"
              clearable
              @change="handleCollegeChange"
              style="width: 200px"
            >
              <el-option
                v-for="college in filteredColleges"
                :key="college.departmentId"
                :label="college.title"
                :value="college.departmentId"
              />
            </el-select>
          </el-form-item>

          <!-- 动态显示专业选择 -->
          <el-form-item :label="showCollegeSelect ? '专业' : '专业'" prop="departmentId">
            <el-select
              v-model="filterForm.departmentId"
              placeholder="请选择专业"
              clearable
              @change="handleDepartmentChange"
              style="width: 200px"
            >
              <el-option
                v-for="dept in filteredDepartments"
                :key="dept.departmentId"
                :label="dept.title"
                :value="dept.departmentId"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="学号" prop="keyword">
            <el-input
              v-model="filterForm.keyword"
              placeholder="请输入学号"
              clearable
              @keyup.enter.native="handleFilter"
              style="width: 200px"
            />
          </el-form-item>

          <el-form-item label="姓名" prop="nameKeyword">
            <el-input
              v-model="filterForm.nameKeyword"
              placeholder="请输入学生姓名"
              clearable
              @keyup.enter.native="handleFilter"
              style="width: 200px"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleFilter">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="handleResetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 人员选择列表 -->
      <div class="participant-section">
        <div class="participant-header">
          <div class="header-left">
            <i class="el-icon-user"></i>
            <span>参与人员 ({{ filteredStudents.length }}人)</span>
          </div>
          <div class="header-right">
            <el-button-group>
              <el-button size="small" @click="handleSelectAll">全选</el-button>
              <el-button size="small" @click="handleSelectInverse">反选</el-button>
              <el-button size="small" @click="handleSelectNone">全不选</el-button>
            </el-button-group>
            <span class="selected-count">已选择: {{ selectedStudents.length }}人</span>
          </div>
        </div>
        <div class="participant-content">
          <el-table
            :data="paginatedStudents"
            @selection-change="handleSelectionChange"
            v-loading="loading"
            height="400"
            stripe
            ref="studentTable"
            :reserve-selection="true"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="studentNo" label="学号" width="120" />
            <el-table-column prop="studentName" label="姓名" width="80" />
            <el-table-column label="性别" align="center" prop="gender" width="80">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_user_sex" :value="scope.row.gender"/>
              </template>
            </el-table-column>
            <el-table-column prop="schoolName" label="学校" width="150" />
            <el-table-column prop="collegeName" label="学院" width="150" />
            <el-table-column prop="departmentName" label="专业" />
          </el-table>
          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
              :current-page="pagination.page"
              :page-sizes="[20, 50, 100, 200]"
              :page-size="pagination.size"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredStudents.length"
            />
          </div>
        </div>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取 消</el-button>
      <el-button type="primary" @click="handleConfirm">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { listSchool } from "@/api/school/school"
import { getDepartmentTree } from "@/api/school/department"
import { listStudent } from "@/api/school/student"

export default {
  name: "ParticipantConfigDialog",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    activityData: {
      type: Object,
      default: () => ({})
    }
  },
  dicts: ['sys_user_sex'],
  data() {
    return {
      // 加载状态
      loading: false,
      // 是否正在初始化
      initializing: false,
      // 部门结构数据
      departmentStructure: [],
      // 所有学生数据
      allStudents: [],
      // 筛选后的学生数据
      filteredStudents: [],
      // 选中的学生ID数组
      selectedStudents: [],
      // 筛选表单
      filterForm: {
        schoolId: null,
        collegeId: null,
        departmentId: null,
        keyword: '',
        nameKeyword: ''
      },
      // 筛选后的学院列表
      filteredColleges: [],
      // 筛选后的专业列表
      filteredDepartments: [],
      // 分页配置
      pagination: {
        page: 1,
        size: 10,
        total: 0
      },
      // 基础数据
      schoolOptions: [],
      collegeOptions: [],
      departmentOptions: [],
      studentOptions: [],
    }
  },
  computed: {
    /** 分页后的学生列表 */
    paginatedStudents() {
      const start = (this.pagination.page - 1) * this.pagination.size
      const end = start + this.pagination.size
      return this.filteredStudents.slice(start, end)
    },
    /** 是否显示院系选择（根据部门结构判断） */
    showCollegeSelect() {
      if (!this.filterForm.schoolId) return false

      const schoolData = this.departmentStructure.find(s => s.schoolId === this.filterForm.schoolId)
      if (!schoolData || !schoolData.departments) return false

      // 检查是否有三级结构（学校-学院-专业）
      const hasThreeLevels = schoolData.departments.some(dept =>
        dept.children && dept.children.length > 0
      )

      return hasThreeLevels
    },
    /** 对话框显示状态 */
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initData()
      }
    }
  },
  created() {
    // 不在created中加载数据，而是在弹窗打开时加载
  },
  methods: {
    /** 初始化数据 */
    async initData() {
      this.loading = true
      console.log('开始初始化数据...')

      try {
        // 先加载学校数据
        console.log('1. 加载学校数据...')
        await this.getSchoolOptions()

        // 再加载学生数据
        console.log('2. 加载学生数据...')
        await this.getStudentOptions()

        // 最后解析配置
        console.log('3. 解析配置...')
        this.parseParticipantConfig()

        console.log('数据初始化完成')

        // 在下一个tick中设置表格选中状态
        this.$nextTick(() => {
          this.setTableSelection()
        })
      } catch (error) {
        console.error('初始化数据失败:', error)
        this.$message.error('加载数据失败，请刷新页面重试')
      } finally {
        this.loading = false
      }
    },
    /** 获取学校选项 */
    async getSchoolOptions() {
      try {
        console.log('调用学校API...')
        const response = await listSchool()
        console.log('学校API响应:', response)

        this.schoolOptions = response.rows || []
        console.log('学校数据设置完成:', this.schoolOptions)

        // 加载学校数据后立即初始化部门结构
        if (this.schoolOptions.length > 0) {
          console.log('开始初始化部门结构...')
          await this.initDepartmentStructure()
        } else {
          console.log('没有学校数据，跳过部门结构初始化')
        }
      } catch (error) {
        console.error('获取学校列表失败:', error)
        this.$message.error('加载学校数据失败')
        throw error
      }
    },
    /** 获取学生选项 */
    async getStudentOptions() {
      try {
        console.log('调用学生API...')
        const response = await listStudent({ pageSize: 1000 })
        console.log('学生API响应:', response)

        this.studentOptions = response.rows || []
        console.log('学生数据设置完成:', this.studentOptions)

        // 更新学生显示信息（此时部门结构已经加载完成）
        this.updateStudentDisplayInfo()

        // 执行初始筛选
        this.handleFilter()
      } catch (error) {
        console.error('获取学生列表失败:', error)
        this.$message.error('加载学生数据失败')
        throw error
      }
    },
    /** 初始化部门结构 */
    async initDepartmentStructure() {
      if (!this.schoolOptions.length) {
        console.log('没有学校数据，跳过部门结构初始化')
        return
      }

      console.log('开始初始化部门结构，学校数量:', this.schoolOptions.length)

      try {
        const promises = this.schoolOptions.map(school => {
          console.log(`获取学校 ${school.title} 的部门树...`)
          return getDepartmentTree(school.schoolId).then(response => {
            console.log(`学校 ${school.title} 部门树响应:`, response)
            return {
              schoolId: school.schoolId,
              schoolName: school.title,
              departments: response.data || []
            }
          }).catch(error => {
            console.error(`获取学校 ${school.title} 的部门结构失败:`, error)
            return {
              schoolId: school.schoolId,
              schoolName: school.title,
              departments: []
            }
          })
        })

        const results = await Promise.all(promises)
        this.departmentStructure = results
        console.log('部门结构加载成功:', this.departmentStructure)

        // 更新选项
        this.updateCollegeOptions()
        this.updateDepartmentOptions()
        console.log('学院选项更新完成:', this.collegeOptions)
        console.log('专业选项更新完成:', this.departmentOptions)
      } catch (error) {
        console.error('初始化部门结构失败:', error)
        this.$message.error('加载部门结构失败，请刷新页面重试')
        throw error
      }
    },
    /** 更新学院选项 */
    updateCollegeOptions() {
      this.collegeOptions = []
      this.departmentStructure.forEach(schoolData => {
        if (schoolData.departments && Array.isArray(schoolData.departments)) {
          schoolData.departments.forEach(dept => {
            this.collegeOptions.push({
              ...dept,
              schoolId: schoolData.schoolId,
              schoolName: schoolData.schoolName
            })
          })
        }
      })
    },
    /** 更新专业选项 */
    updateDepartmentOptions() {
      this.departmentOptions = []
      this.departmentStructure.forEach(schoolData => {
        if (schoolData.departments && Array.isArray(schoolData.departments)) {
          const getAllDepartments = (departments, schoolName) => {
            departments.forEach(dept => {
              this.departmentOptions.push({
                ...dept,
                schoolName: schoolName
              })
              if (dept.children && dept.children.length > 0) {
                getAllDepartments(dept.children, schoolName)
              }
            })
          }
          getAllDepartments(schoolData.departments, schoolData.schoolName)
        }
      })
    },
    /** 更新学生显示信息 */
    updateStudentDisplayInfo() {
      if (!this.studentOptions.length) {
        console.log('没有学生数据，跳过显示信息更新')
        return
      }

      console.log('开始更新学生显示信息，学生数量:', this.studentOptions.length)

      this.studentOptions.forEach(student => {
        // 设置学校名称
        const school = this.schoolOptions.find(s => s.schoolId === student.schoolId)
        student.schoolName = school ? school.title : ''

        // 设置学院和专业名称
        const schoolData = this.departmentStructure.find(s => s.schoolId === student.schoolId)
        if (schoolData && schoolData.departments) {
          // 查找学生所属的专业
          const findDeptInfo = (departments, targetDeptId) => {
            for (let dept of departments) {
              if (dept.departmentId === targetDeptId) {
                return dept
              }
              if (dept.children && dept.children.length > 0) {
                const found = findDeptInfo(dept.children, targetDeptId)
                if (found) return found
              }
            }
            return null
          }

          const deptInfo = findDeptInfo(schoolData.departments, student.departmentId)
          if (deptInfo) {
            student.departmentName = deptInfo.title

            // 查找父级作为学院
            const findParent = (departments, targetDeptId) => {
              for (let dept of departments) {
                if (dept.children && dept.children.some(child => child.departmentId === targetDeptId)) {
                  return dept
                }
                if (dept.children && dept.children.length > 0) {
                  const found = findParent(dept.children, targetDeptId)
                  if (found) return found
                }
              }
              return null
            }

            const parentDept = findParent(schoolData.departments, student.departmentId)
            if (parentDept) {
              // 三级结构：学校-学院-专业
              student.collegeName = parentDept.title
            } else {
              // 二级结构：学校-专业
              student.collegeName = deptInfo.title
            }
          }
        }
      })

      console.log('学生显示信息更新完成')
    },
    /** 学校选择变化 */
    handleSchoolChange() {
      this.filterForm.collegeId = null
      this.filterForm.departmentId = null
      this.updateFilteredColleges()
      this.updateFilteredDepartments()
      this.handleFilter()
    },
    /** 学院选择变化 */
    handleCollegeChange() {
      this.filterForm.departmentId = null
      this.updateFilteredDepartments()
      this.handleFilter()
    },
    /** 专业选择变化 */
    handleDepartmentChange() {
      this.handleFilter()
    },
    /** 更新过滤后的学院 */
    updateFilteredColleges() {
      if (!this.filterForm.schoolId) {
        this.filteredColleges = []
        return
      }

      const schoolData = this.departmentStructure.find(s => s.schoolId === this.filterForm.schoolId)
      if (!schoolData || !schoolData.departments) {
        this.filteredColleges = []
        return
      }

      // 如果是三级结构，显示学院（一级部门）
      if (this.showCollegeSelect) {
        this.filteredColleges = schoolData.departments.map(dept => ({
          ...dept,
          schoolId: schoolData.schoolId,
          schoolName: schoolData.schoolName
        }))
      } else {
        // 如果是二级结构，不显示学院选择
        this.filteredColleges = []
      }
    },
    /** 更新过滤后的专业 */
    updateFilteredDepartments() {
      if (!this.filterForm.schoolId) {
        this.filteredDepartments = []
        return
      }

      const schoolData = this.departmentStructure.find(s => s.schoolId === this.filterForm.schoolId)
      if (!schoolData || !schoolData.departments) {
        this.filteredDepartments = []
        return
      }

      if (this.showCollegeSelect) {
        // 三级结构：根据选择的学院过滤专业
        if (!this.filterForm.collegeId) {
          this.filteredDepartments = []
          return
        }

        const selectedCollege = schoolData.departments.find(dept => dept.departmentId === this.filterForm.collegeId)
        if (selectedCollege && selectedCollege.children) {
          this.filteredDepartments = selectedCollege.children.map(dept => ({
            ...dept,
            schoolId: schoolData.schoolId,
            schoolName: schoolData.schoolName
          }))
        } else {
          this.filteredDepartments = []
        }
      } else {
        // 二级结构：直接显示所有专业
        this.filteredDepartments = schoolData.departments.map(dept => ({
          ...dept,
          schoolId: schoolData.schoolId,
          schoolName: schoolData.schoolName
        }))
      }
    },
    /** 执行筛选 */
    handleFilter() {
      console.log('开始执行筛选...')
      console.log('筛选条件:', this.filterForm)
      console.log('学生数据:', this.studentOptions)

      this.loading = true

      let filtered = this.studentOptions.filter(student => {
        // 学校筛选
        if (this.filterForm.schoolId && student.schoolId !== this.filterForm.schoolId) {
          return false
        }

        // 学院筛选（三级结构）
        if (this.showCollegeSelect && this.filterForm.collegeId) {
          const studentCollege = this.getStudentCollege(student)
          if (!studentCollege || studentCollege.departmentId !== this.filterForm.collegeId) {
            return false
          }
        }

        // 专业筛选
        if (this.filterForm.departmentId && student.departmentId !== this.filterForm.departmentId) {
          return false
        }

        // 学号搜索
        if (this.filterForm.keyword) {
          const keyword = this.filterForm.keyword.toLowerCase()
          if (!student.studentNo.toLowerCase().includes(keyword)) {
            return false
          }
        }

        // 姓名搜索
        if (this.filterForm.nameKeyword) {
          const nameKeyword = this.filterForm.nameKeyword.toLowerCase()
          if (!student.studentName.toLowerCase().includes(nameKeyword)) {
            return false
          }
        }

        return true
      })

      this.filteredStudents = filtered
      this.pagination.page = 1
      this.loading = false

      console.log('筛选完成，结果数量:', this.filteredStudents.length)

      // 在下一个tick中设置表格选中状态
      this.$nextTick(() => {
        this.setTableSelection()
      })
    },
    /** 设置表格选中状态 */
    setTableSelection() {
      if (!this.$refs.studentTable) return

      console.log('设置表格选中状态，当前页学生:', this.paginatedStudents.length)
      console.log('当前页选中的学生:', this.paginatedStudents.filter(s => this.selectedStudents.includes(s.studentId)).length)
      console.log('总选中的学生:', this.selectedStudents.length)
      console.log('选中学生ID:', JSON.stringify(this.selectedStudents))

      // 设置初始化标志，避免触发选择变化事件
      this.initializing = true

      // 清除所有选中状态
      this.$refs.studentTable.clearSelection()

      // 设置当前页的选中状态
      this.paginatedStudents.forEach(student => {
        if (this.selectedStudents.includes(student.studentId)) {
          this.$refs.studentTable.toggleRowSelection(student, true)
        }
      })

      // 清除初始化标志
      this.initializing = false

      console.log('表格选中状态设置完成')
    },
    /** 重置筛选条件 */
    handleResetFilter() {
      this.filterForm = {
        schoolId: null,
        collegeId: null,
        departmentId: null,
        keyword: '',
        nameKeyword: ''
      }
      this.filteredColleges = []
      this.filteredDepartments = []
      this.handleFilter()
    },
    /** 全选 */
    handleSelectAll() {
      console.log('执行全选，当前筛选结果:', this.filteredStudents.length)
      this.selectedStudents = this.filteredStudents.map(s => s.studentId)
      console.log('全选后选中学生:', this.selectedStudents.length)
      // 在下一个tick中设置表格选中状态
      this.$nextTick(() => {
        this.setTableSelection()
      })
    },
    /** 反选 */
    handleSelectInverse() {
      console.log('执行反选，当前筛选结果:', this.filteredStudents.length)
      const currentSelected = new Set(this.selectedStudents)
      this.selectedStudents = this.filteredStudents
        .filter(s => !currentSelected.has(s.studentId))
        .map(s => s.studentId)
      console.log('反选后选中学生:', this.selectedStudents.length)
      // 在下一个tick中设置表格选中状态
      this.$nextTick(() => {
        this.setTableSelection()
      })
    },
    /** 全不选 */
    handleSelectNone() {
      console.log('执行全不选')
      this.selectedStudents = []
      // 在下一个tick中设置表格选中状态
      this.$nextTick(() => {
        this.setTableSelection()
      })
    },
    /** 表格选择变化 */
    handleSelectionChange(selection) {
      console.log('表格选择变化，当前选中:', selection.length)
      console.log('当前页学生ID:', this.paginatedStudents.map(s => s.studentId))
      console.log('当前选中学生ID:', selection.map(s => s.studentId))
      console.log('变化前总选中学生:', this.selectedStudents.length)
      console.log('变化前选中学生ID:', JSON.stringify(this.selectedStudents))

      // 如果是在初始化阶段，不处理选择变化
      if (this.initializing) {
        console.log('正在初始化中，跳过选择变化处理')
        return
      }

      // 获取当前页所有学生的ID
      const currentPageStudentIds = this.paginatedStudents.map(s => s.studentId)

      // 获取当前页新选中的学生ID
      const newSelectedIds = selection.map(s => s.studentId)

      // 保留其他页面的选中状态，更新当前页的选中状态
      this.selectedStudents = this.selectedStudents.filter(id => !currentPageStudentIds.includes(id))
      this.selectedStudents = [...this.selectedStudents, ...newSelectedIds]

      console.log('更新后的选中学生:', this.selectedStudents.length)
      console.log('更新后选中学生ID:', JSON.stringify(this.selectedStudents))
    },
    /** 分页变化 */
    handlePageChange(page) {
      this.pagination.page = page
      // 在下一个tick中设置表格选中状态
      this.$nextTick(() => {
        this.setTableSelection()
      })
    },
    /** 分页大小变化 */
    handleSizeChange(size) {
      this.pagination.size = size
      this.pagination.page = 1
      // 在下一个tick中设置表格选中状态
      this.$nextTick(() => {
        this.setTableSelection()
      })
    },
    /** 获取学生所属的学院 */
    getStudentCollege(student) {
      const schoolData = this.departmentStructure.find(s => s.schoolId === student.schoolId)
      if (!schoolData || !schoolData.departments) return null

      // 查找学生所属专业的父级部门（学院）
      const findParent = (departments, targetDeptId) => {
        for (let dept of departments) {
          if (dept.children && dept.children.some(child => child.departmentId === targetDeptId)) {
            return dept
          }
          if (dept.children && dept.children.length > 0) {
            const found = findParent(dept.children, targetDeptId)
            if (found) return found
          }
        }
        return null
      }

      return findParent(schoolData.departments, student.departmentId)
    },
    /** 解析参与人配置 */
    parseParticipantConfig() {
      if (this.activityData.participantConfig) {
        try {
          const config = JSON.parse(this.activityData.participantConfig)
          this.selectedStudents = config.students || []
          console.log('解析参与人配置成功，选中学生数量:', this.selectedStudents.length)
          console.log('选中的学生ID:', this.selectedStudents)
        } catch (e) {
          console.error('解析参与人配置失败:', e)
          this.selectedStudents = []
        }
      } else {
        console.log('没有参与人配置，初始化为空')
        this.selectedStudents = []
      }
    },
    /** 确认配置 */
    handleConfirm() {
      const config = {
        students: this.selectedStudents
      }
      this.$emit('confirm', config)
      this.$emit('update:visible', false)
    },
    /** 取消 */
    handleCancel() {
      this.$emit('update:visible', false)
    },
    /** 加载学生数据 */
    async loadStudents() {
      try {
        this.loading = true
        const response = await listStudent({
          pageNum: 1,
          pageSize: 1000, // 获取所有学生
          ...this.filterParams
        })

        this.allStudents = response.rows || []
        console.log('加载到学生数据:', this.allStudents.length)

        // 数据加载完成后，设置选中状态
        this.$nextTick(() => {
          this.setTableSelection()
        })
      } catch (error) {
        console.error('加载学生数据失败:', error)
        this.$message.error('加载学生数据失败')
      } finally {
        this.loading = false
      }
    },
  }
}
</script>

<style scoped>
.participant-config-dialog {
  max-height: 80vh;
}

.participant-config-modern {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
  margin-bottom: 20px;
}

.filter-section .el-form {
  margin-bottom: 0;
}

.filter-section .el-form-item {
  margin-bottom: 16px;
  margin-right: 16px;
}

.filter-section .el-form-item:last-child {
  margin-right: 0;
}

.filter-section .el-form-item__label {
  font-weight: 500;
  color: #606266;
}

.filter-section .el-select,
.filter-section .el-input {
  width: 200px;
}

.filter-section .el-button {
  margin-left: 8px;
}

.filter-section .el-button:first-child {
  margin-left: 0;
}

.participant-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
}

.participant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e1e8ed;
}

.header-left {
  display: flex;
  align-items: center;
  color: #2c3e50;
  font-weight: 600;
  font-size: 16px;
}

.header-left i {
  margin-right: 8px;
  color: #409eff;
  font-size: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.selected-count {
  color: #409eff;
  font-weight: 600;
  font-size: 14px;
  background: rgba(64, 158, 255, 0.1);
  padding: 6px 12px;
  border-radius: 16px;
}

.participant-content {
  max-height: 500px;
  overflow-y: auto;
}

.el-table {
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e1e8ed;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .filter-section .el-form-item {
    margin-bottom: 12px;
  }
}

@media (max-width: 768px) {
  .filter-section .el-form-item {
    margin-right: 0;
  }

  .participant-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .header-right {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
