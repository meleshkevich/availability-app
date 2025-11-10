<template>
  <el-card class="upload-card">
    <el-upload
      class="upload-demo"
      drag
      action=""
      :on-change="onFileChange"
      accept=".xlsx, .xls"
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">Drag the file here, or <em>click to upload</em></div>
      <div class="el-upload__tip" slot="tip">Only .xlsx and .xls files are accepted</div>
    </el-upload>

    <!-- Модальные окна -->
    <el-dialog v-model="incompatibleDialogVisible" title="Warning">
      <p>Incompatible data structure!</p>
      <p>Make sure the table contains the following columns with matching types:</p>
      <ul>
        <li><strong>Date:</strong> Date</li>
        <li><strong>Sailing:</strong> Text</li>
        <li><strong>Service:</strong> Text</li>
      </ul>
      <span slot="footer" class="dialog-footer">
        <el-button @click="incompatibleDialogVisible = false">Close</el-button>
      </span>
    </el-dialog>

    <el-dialog v-model="readyToUploadDialogVisible" title="Confirmation">
      <p>File is ready to be uploaded!</p>
      <span slot="footer" class="dialog-footer">
        <el-button @click="readyToUploadDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="uploadRecords">Upload</el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref } from 'vue';
import ExcelJS from 'exceljs';
import { ElMessage } from 'element-plus';
import useSupabase from '~/composables/useSupabase';

const incompatibleDialogVisible = ref(false);
const readyToUploadDialogVisible = ref(false);
const records = ref([]);
const { supabase } = useSupabase();

const onFileChange = async (file) => {
  if (!file.raw) return;

  const workbook = new ExcelJS.Workbook();
  const reader = new FileReader();

  reader.onload = async function(e) {
    const arrayBuffer = e.target.result;
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);
    const expectedHeaders = ['Date', 'Sailing', 'Service'];

    // Проверка заголовков
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values.slice(1);

    if (!expectedHeaders.every((header, i) => header === headers[i])) {
      incompatibleDialogVisible.value = true;
      return;
    }

    // Извлечение service types из Supabase
    const { data: serviceTypes } = await supabase
      .from('service_types')
      .select('id, name');

    const serviceTypeMap = new Map(serviceTypes.map(type => [type.name, type.id]));

    records.value = [];
    worksheet.eachRow((row, index) => {
      if (index === 1) return; // Пропускаем заголовок
      const [date, sailing, serviceName] = row.values.slice(1);

      const serviceTypeId = serviceTypeMap.get(serviceName);
      if (!serviceTypeId) {
        console.warn(`Не найден service_type_id для сервиса: ${serviceName}`);
        ElMessage.warning(`Не найден type_id для сервиса: ${serviceName}`);
        return;
      }

      const record = {
        date,
        sailing,
        service: serviceName,
        service_type_id: serviceTypeId
      };
      records.value.push(record);
    });

    if (records.value.length > 0) {
      readyToUploadDialogVisible.value = true;
    } else {
      ElMessage.info('Нет данных для загрузки');
    }
  };

  reader.readAsArrayBuffer(file.raw);
};

const uploadRecords = async () => {
  if (records.value.length > 0) {
    const { data, error } = await supabase
      .from('services')
      .insert(records.value);

    if (error) {
      console.error('Ошибка при вставке данных:', error.message);
      ElMessage.error('Не удалось загрузить данные');
    } else {
      console.log('Данные успешно загружены:', data);
      ElMessage.success('Данные успешно загружены');
    }
  }
  readyToUploadDialogVisible.value = false;
};
</script>

<style scoped>
.upload-card {
  margin-top: 20px;
  padding: 16px;
  text-align: center;
}

.upload-demo {
  display: inline-block;
  width: 100%;
  max-width: 360px;
  margin: auto;
}
</style>