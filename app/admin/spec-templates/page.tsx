'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/apiClient'
import { CategoryResponseDTO, SpecTemplateGroup, SpecTemplateResponseDTO } from '@/lib/types'
import { toast } from 'sonner'
import { FaTrashCan, FaPlus, FaFloppyDisk } from 'react-icons/fa6'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminSpecTemplatesPage() {
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [groups, setGroups] = useState<SpecTemplateGroup[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.getCategories()
        setCategories(res.data.data)
      } catch (error) {
        toast.error('Failed to fetch categories')
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!selectedCategoryId) {
      setGroups([])
      setTemplateName('')
      setTemplateId(null)
      return
    }

    const fetchTemplate = async () => {
      try {
        const res = await apiClient.getSpecTemplateByCategoryId(selectedCategoryId)
        if (res.data.data) {
          setTemplateId(res.data.data.id)
          setTemplateName(res.data.data.templateName)
          setGroups(res.data.data.groups)
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          // No template exists yet
          setTemplateId(null)
          setTemplateName(`${categories.find(c => c.id === selectedCategoryId)?.name || ''} Standard Template`)
          setGroups([])
        } else {
          toast.error('Failed to load template')
        }
      }
    }
    
    fetchTemplate()
  }, [selectedCategoryId, categories])

  const handleAddGroup = () => {
    setGroups([...groups, { groupName: 'New Group', specKeys: [] }])
  }

  const handleUpdateGroupName = (index: number, newName: string) => {
    const newGroups = [...groups]
    newGroups[index].groupName = newName
    setGroups(newGroups)
  }

  const handleDeleteGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index))
  }

  const handleAddKey = (groupIndex: number) => {
    const newGroups = [...groups]
    newGroups[groupIndex].specKeys.push('New Key')
    setGroups(newGroups)
  }

  const handleUpdateKey = (groupIndex: number, keyIndex: number, newValue: string) => {
    const newGroups = [...groups]
    newGroups[groupIndex].specKeys[keyIndex] = newValue
    setGroups(newGroups)
  }

  const handleDeleteKey = (groupIndex: number, keyIndex: number) => {
    const newGroups = [...groups]
    newGroups[groupIndex].specKeys.splice(keyIndex, 1)
    setGroups(newGroups)
  }

  const handleSave = async () => {
    if (!selectedCategoryId) return toast.error('Please select a category')
    if (!templateName.trim()) return toast.error('Template name is required')
    
    const validGroups = groups.filter(g => g.groupName.trim()).map(g => ({
      groupName: g.groupName.trim(),
      specKeys: g.specKeys.filter(k => k.trim()).map(k => k.trim())
    }))

    if (validGroups.length === 0) return toast.error('Add at least one valid group')

    setSaving(true)
    try {
      await apiClient.saveSpecTemplate({
        categoryId: selectedCategoryId,
        templateName,
        groups: validGroups
      })
      toast.success('Template saved successfully')
    } catch (error) {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!templateId) return
    if (!confirm('Are you sure you want to delete this template?')) return
    
    try {
      await apiClient.deleteSpecTemplate(templateId)
      toast.success('Template deleted')
      setTemplateId(null)
      setGroups([])
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Specification Templates</h1>
          <p className="text-muted-foreground">Manage default specification blueprints for each product category.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Col: Category Selector */}
        <div className="lg:col-span-1 border border-border rounded-xl bg-card p-4 space-y-4 shadow-sm h-fit">
          <h2 className="font-bold text-lg">Select Category</h2>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right Col: Editor */}
        <div className="lg:col-span-3">
          {!selectedCategoryId ? (
            <div className="border border-dashed border-border rounded-xl bg-card p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <FaListCheck className="text-4xl text-muted-foreground/30 mb-4" />
              <p>Select a category from the left to edit its template</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-muted/30 p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Template Name</label>
                  <input 
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 font-bold"
                    placeholder="e.g. Smartphones Standard Template"
                  />
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                  {templateId && (
                    <button onClick={handleDeleteTemplate} className="text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-lg font-bold text-sm transition-colors">
                      Delete
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50">
                    <FaFloppyDisk />
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {groups.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No groups defined for this template.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groups.map((group, gIdx) => (
                      <div key={gIdx} className="border border-border rounded-xl overflow-hidden bg-muted/10">
                        <div className="bg-muted/30 p-3 border-b border-border flex items-center justify-between">
                          <input 
                            value={group.groupName}
                            onChange={e => handleUpdateGroupName(gIdx, e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-primary focus:ring-1 focus:ring-primary rounded px-2 py-1 w-1/2"
                            placeholder="Group Name (e.g. Display)"
                          />
                          <button onClick={() => handleDeleteGroup(gIdx)} className="text-muted-foreground hover:text-rose-500 p-2 rounded-lg transition-colors" title="Delete Group">
                            <FaTrashCan size={14} />
                          </button>
                        </div>
                        <div className="p-4 space-y-2">
                          {group.specKeys.map((key, kIdx) => (
                            <div key={kIdx} className="flex items-center gap-2">
                              <input 
                                value={key}
                                onChange={e => handleUpdateKey(gIdx, kIdx, e.target.value)}
                                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                placeholder="Key (e.g. Screen Size)"
                              />
                              <button onClick={() => handleDeleteKey(gIdx, kIdx)} className="text-muted-foreground hover:text-rose-500 p-2 rounded-lg transition-colors">
                                <FaTrashCan size={14} />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => handleAddKey(gIdx)} className="text-xs font-bold text-primary hover:underline mt-2 flex items-center gap-1 px-1">
                            <FaPlus size={10} /> Add Key
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={handleAddGroup} className="w-full py-3 border border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors flex items-center justify-center gap-2">
                  <FaPlus size={12} /> Add New Group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
