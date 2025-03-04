import React, { useEffect } from 'react';
import { Typography, Button, Form, Input, Select, Card, Tooltip, Row, Col } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { 
  Localizable, 
  DEFAULT_LANGUAGE, 
  createLocalizable, 
  getLocalizedValue,
  InputField
} from '../../../types/types';
import LocalizableInput from '../../../components/LocalizableInput/LocalizableInput';

const { Title, Paragraph } = Typography;

interface InputsConfigProps {
  formData: {
    inputs: Array<InputField>;
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const inputTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Image', value: 'image' },
  { label: 'Select', value: 'select' },
  { label: 'File', value: 'file' },
  { label: 'Audio', value: 'audio' },
];

export function InputsConfig({ formData, setFormData }: InputsConfigProps) {
  const [form] = Form.useForm();
  
  // Generate a filename from the title
  const generateFilename = (title: Localizable<string>): string => {
    const displayTitle = getLocalizedValue(title, DEFAULT_LANGUAGE) || '';
    
    const baseFilename = displayTitle
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);
    
    return baseFilename ? `${baseFilename}.md` : '';
  };
  
  // Handle form values change
  const onValuesChange = (changedValues: any, allValues: any) => {
    if (changedValues.inputs) {
      const updatedInputs = allValues.inputs?.map((input: any) => {
        if (input && input.title) {
          return {
            ...input,
            filename: generateFilename(input.title)
          };
        }
        return input;
      }).filter(Boolean) || [];
      
      // Update form and parent
      form.setFieldsValue({ inputs: updatedInputs });
      setFormData({
        ...formData,
        inputs: updatedInputs
      });
      
      console.log("Form values updated:", { 
        inputsLength: updatedInputs.length,
        inputs: updatedInputs
      });
    }
  };
  
  // Handle adding a new field
  const handleAddField = () => {
    const currentInputs = form.getFieldValue('inputs') || [];
    const newInput = {
      title: createLocalizable(DEFAULT_LANGUAGE, ''),
      filename: '',
      type: 'text',
      required: false,
      placeholder: createLocalizable(DEFAULT_LANGUAGE, '')
    };
    
    // Update the form directly
    form.setFieldsValue({
      inputs: [...currentInputs, newInput]
    });
    
    // Trigger the onValuesChange handler to update parent state
    onValuesChange(
      { inputs: [...currentInputs, newInput] },
      { inputs: [...currentInputs, newInput] }
    );
    
    console.log("Added new field, total inputs:", currentInputs.length + 1);
  };
  
  // Handle removing a field
  const handleRemoveField = (index: number) => {
    const currentInputs = form.getFieldValue('inputs') || [];
    const newInputs = [...currentInputs];
    newInputs.splice(index, 1);
    
    // Update the form directly
    form.setFieldsValue({
      inputs: newInputs
    });
    
    // Trigger the onValuesChange handler to update parent state
    onValuesChange(
      { inputs: newInputs },
      { inputs: newInputs }
    );
    
    console.log("Removed field, total inputs:", newInputs.length);
  };
  
  // Initialize form with current values
  useEffect(() => {
    if (formData && Array.isArray(formData.inputs)) {
      form.setFieldsValue({ inputs: formData.inputs });
      console.log("Form initialized with inputs:", {
        length: formData.inputs.length,
        inputs: formData.inputs
      });
    }
  }, [formData, form]);
  
  return (
    <div>
      <Title level={4}>Input Fields</Title>
      <Paragraph className="text-gray-500 mb-4">
        Define the input fields that users will need to fill in before generating content.
      </Paragraph>
      
      <Form 
        form={form}
        onValuesChange={onValuesChange}
        layout="vertical"
        initialValues={{ inputs: formData.inputs || [] }}
      >
        <Form.List name="inputs">
          {(fields) => (
            <div className="space-y-4">
              {fields.map(({ key, name, ...restField }) => (
                <Card 
                  key={key} 
                  className="input-field-card"
                  title={getLocalizedValue(form.getFieldValue(['inputs', name, 'title']), DEFAULT_LANGUAGE) || 'New Field'}
                  extra={
                    <Tooltip title="Remove Field">
                      <Button 
                        type="text" 
                        danger 
                        icon={<MinusCircleOutlined />} 
                        onClick={() => handleRemoveField(name)}
                      />
                    </Tooltip>
                  }
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'title']}
                        label="Field Name"
                        rules={[{ required: true, message: 'Field name is required' }]}
                      >
                        <LocalizableInput placeholder="Enter field name" />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'type']}
                        label="Field Type"
                        rules={[{ required: true, message: 'Field type is required' }]}
                      >
                        <Select placeholder="Select field type">
                          {inputTypes.map(type => (
                            <Select.Option key={type.value} value={type.value}>
                              {type.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'placeholder']}
                        label="Placeholder"
                      >
                        <LocalizableInput placeholder="Enter placeholder text" />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'required']}
                        label="Required"
                        valuePropName="checked"
                      >
                        <Select>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    {...restField}
                    name={[name, 'filename']}
                    label="File Name"
                    extra="Auto-generated from field name. Will be used to reference this field in actions."
                  >
                    <Input disabled />
                  </Form.Item>
                </Card>
              ))}
              
              <Button 
                type="dashed" 
                onClick={handleAddField} 
                block 
                icon={<PlusOutlined />}
              >
                Add Field
              </Button>
            </div>
          )}
        </Form.List>
      </Form>
    </div>
  );
} 