// Client Page Dynamic Management
const TaskManager = {
    updateStatusFromSelect: async function(selectElement) {
        const clientId = selectElement.getAttribute('data-client-id');
        const projectId = selectElement.getAttribute('data-project-id');
        const taskId = selectElement.getAttribute('data-task-id');
        const newStatus = selectElement.value;
        const oldValue = selectElement.getAttribute('data-old-value') || newStatus;
        
        // עדכון data-status של ה-select לפי הסטטוס החדש
        selectElement.setAttribute('data-status', newStatus);
        
        const loader = Loader.show(selectElement.closest('.task-row, .task-card'));
        try {
            const result = await API.post(`/update_task_status/${clientId}/${projectId}/${taskId}`, { status: newStatus });
            
            Loader.hide(loader);
            
            if (result.ok && result.data.status === 'success') {
                selectElement.setAttribute('data-old-value', newStatus);
                if (newStatus === 'הושלם' || newStatus === 'בוצע') {
                    Toast.show('משימה הושלמה!', 'success');
                } else {
                    Toast.show('סטטוס המשימה עודכן', 'success');
                }
            } else {
                Toast.show(result.data.error || 'שגיאה בעדכון המשימה', 'error');
                selectElement.value = oldValue;
                selectElement.setAttribute('data-status', oldValue);
            }
        } catch (error) {
            Loader.hide(loader);
            Toast.show('שגיאה בהתקשרות לשרת', 'error');
            selectElement.value = oldValue;
            selectElement.setAttribute('data-status', oldValue);
            console.error('Update status error:', error);
        }
    },
    
    updateNote: async function(clientId, projectId, taskId, form) {
        const formData = new FormData(form);
        const note = formData.get('notes') || '';
        
        const loader = Loader.show(form);
        try {
            const result = await API.post(`/update_task/${clientId}/${projectId}/${taskId}`, {
                notes: note
            });
            
            Loader.hide(loader);
            
            if (result.ok && result.data && result.data.status === 'success') {
                Toast.show('ההערה עודכנה בהצלחה', 'success');
            } else {
                console.error('Update note failed:', result);
                const errorMsg = (result.data && result.data.error) || 'שגיאה בעדכון ההערה';
                Toast.show(errorMsg, 'error');
            }
        } catch (error) {
            Loader.hide(loader);
            Toast.show('שגיאה בהתקשרות לשרת', 'error');
            console.error('Update note error:', error);
        }
    },
    
    deleteNote: async function(clientId, projectId, taskId) {
        if (!confirm('האם אתה בטוח שברצונך למחוק את ההערה?')) return;
        
        const loader = Loader.show();
        try {
            const result = await API.post(`/update_task/${clientId}/${projectId}/${taskId}`, {
                notes: ''
            });
            
            Loader.hide(loader);
            
            if (result.ok && result.data && result.data.status === 'success') {
                Toast.show('ההערה נמחקה בהצלחה', 'success');
                setTimeout(() => location.reload(), 300);
            } else {
                console.error('Delete note failed:', result);
                const errorMsg = (result.data && result.data.error) || 'שגיאה במחיקת ההערה';
                Toast.show(errorMsg, 'error');
            }
        } catch (error) {
            Loader.hide(loader);
            Toast.show('שגיאה בהתקשרות לשרת', 'error');
            console.error('Delete note error:', error);
        }
    },
    
    delete: async function(clientId, projectId, taskId, buttonElement) {
        if (!confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) return;
        
        const loader = Loader.show();
        try {
            const result = await API.post(`/delete_task/${clientId}/${projectId}/${taskId}`, {});
            
            Loader.hide(loader);
            
            console.log('Delete task result:', result);
            console.log('Task ID:', taskId);
            
            if (result.ok && result.data && result.data.status === 'success') {
                Toast.show('המשימה נמחקה בהצלחה', 'success');
                // פשוט טען את הדף מחדש כדי להציג את השינויים
                setTimeout(() => location.reload(), 300);
            } else {
                console.error('Delete task failed:', result);
                const errorMsg = (result.data && result.data.error) || (result.data && result.data.message) || 'שגיאה במחיקת המשימה';
                Toast.show(errorMsg, 'error');
            }
        } catch (error) {
            Loader.hide(loader);
            Toast.show('שגיאה בהתקשרות לשרת', 'error');
            console.error('Delete task error:', error);
        }
    },
    
    add: async function(clientId, projectId, form) {
        const formData = new FormData(form);
        const title = formData.get('title');
        const status = formData.get('status') || 'לביצוע';
        const note = formData.get('note') || '';
        const priority = formData.get('priority') || 'medium';
        const deadline = formData.get('deadline') || '';
        const assignee = formData.get('assignee') || '';
        const estimated_hours = formData.get('estimated_hours') || '';
        const dependencies = Array.from(formData.getAll('dependencies'));
        
        if (!title) {
            Toast.show('אנא הזן כותרת משימה', 'error');
            return;
        }
        
        const loader = Loader.show(form.closest('.project-card-new, .project-card'));
        try {
            const taskData = {
                title, status, note, priority,
                deadline, assignee, estimated_hours, dependencies
            };
            // הסר שדות ריקים
            Object.keys(taskData).forEach(key => {
                if (taskData[key] === '' || (Array.isArray(taskData[key]) && taskData[key].length === 0)) {
                    delete taskData[key];
                }
            });
            
            const result = await API.post(`/add_task/${clientId}/${projectId}`, taskData);
            
            Loader.hide(loader);
            
            if (result.ok && result.data && result.data.status === 'success') {
                const task = result.data.data.task;
                const projectCard = form.closest('.project-card-new, .project-card');
                const tasksList = projectCard ? projectCard.querySelector('.tasks-list') : null;
                
                if (!tasksList) {
                    Toast.show('שגיאה: לא נמצא מיכל משימות', 'error');
                    return;
                }
                
                // Build task HTML matching the new single-row template structure
                const notePreview = task.note ? 
                    `${task.note.length > 30 ? task.note.substring(0, 30) + '...' : task.note}` : 
                    '';
                const taskHtml = `
                    <div class="task-row" data-task-id="${task.id}" style="background: white; padding: 12px 18px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e6e9ef; display: flex; align-items: center; gap: 15px; transition: all 0.3s; flex-wrap: wrap; overflow: hidden;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: bold; color: #292f4c; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(task.title)}</div>
                        </div>
                        <select class="task-status-select" data-status="${task.status || 'לביצוע'}" data-client-id="${clientId}" data-project-id="${projectId}" data-task-id="${task.id}" onchange="TaskManager.updateStatusFromSelect(this)" style="padding: 8px 16px; border-radius: 8px; min-width: 180px; font-weight: 600;">
                            <option value="לביצוע" ${task.status === 'לביצוע' ? 'selected' : ''}>לביצוע</option>
                            <option value="הועבר לסטודיו" ${task.status === 'הועבר לסטודיו' ? 'selected' : ''}>הועבר לסטודיו</option>
                            <option value="הועבר לדיגיטל" ${task.status === 'הועבר לדיגיטל' ? 'selected' : ''}>הועבר לדיגיטל</option>
                            <option value="נשלח ללקוח" ${task.status === 'נשלח ללקוח' ? 'selected' : ''}>נשלח ללקוח</option>
                            <option value="הושלם" ${task.status === 'הושלם' ? 'selected' : ''}>הושלם</option>
                        </select>
                        <span style="color: #666; font-size: 0.85rem; white-space: nowrap; min-width: 100px;">📅 ${task.created_date || 'ללא תאריך'}</span>
                        ${task.note ? 
                            `<span class="note-trigger" data-client-id="${clientId}" data-project-id="${projectId}" data-task-id="${task.id}" data-note="${this.escapeHtml(task.note).replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" style="color: #0073ea; font-size: 0.85rem; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; border-bottom: 1px dotted #0073ea; padding: 2px 0;" title="לחץ לעריכה">📝 ${this.escapeHtml(notePreview)}</span>` :
                            `<span class="note-trigger" data-client-id="${clientId}" data-project-id="${projectId}" data-task-id="${task.id}" data-note="" style="color: #999; font-size: 0.85rem; cursor: pointer; white-space: nowrap; padding: 2px 0;">➕ הוסף הערה</span>`
                        }
                        <button onclick="TaskManager.delete('${clientId}', '${projectId}', '${task.id}', this)" style="background: #d66b74; color: white; border: none; padding: 6px 10px; border-radius: 5px; cursor: pointer; font-size: 0.85rem; white-space: nowrap;">🗑️</button>
                    </div>
                `;
                
                tasksList.insertAdjacentHTML('beforeend', taskHtml);
                form.reset();
                // הסתר שדות מתקדמים אחרי הוספה
                const advancedFields = form.querySelector('.task-advanced-fields');
                if (advancedFields) {
                    advancedFields.style.display = 'none';
                }
                Toast.show('המשימה נוספה בהצלחה', 'success');
                // רענן את רשימת התלויות בטופסים אחרים
                this.refreshDependenciesSelects(projectId);
            } else {
                Toast.show(result.data.error || 'שגיאה בהוספת המשימה', 'error');
            }
        } catch (error) {
            Loader.hide(loader);
            Toast.show('שגיאה בהתקשרות לשרת', 'error');
            console.error('Add task error:', error);
        }
    },
    
    showAdvancedForm: function(button) {
        const form = button.closest('form');
        const advancedFields = form.querySelector('.task-advanced-fields');
        if (advancedFields) {
            const isHidden = advancedFields.style.display === 'none' || !advancedFields.style.display;
            advancedFields.style.display = isHidden ? 'block' : 'none';
            button.textContent = isHidden ? 'הסתר פרטים' : 'פרטים נוספים';
        }
    },
    
    refreshDependenciesSelects: function(projectId) {
        // רענון רשימת התלויות בכל הטופסים
        document.querySelectorAll('.task-dependencies-select').forEach(select => {
            const form = select.closest('form');
            if (form && form.dataset.projectId === projectId) {
                // רענון רשימת תלויות - ניתן להוסיף AJAX call או לעדכן ידנית
            }
        });
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    showNoteModal: async function(clientId, projectId, taskId, currentNote) {
        // Decode HTML entities if needed
        let decodedNote = currentNote || '';
        if (decodedNote) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = decodedNote.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            decodedNote = tempDiv.textContent || tempDiv.innerText || decodedNote;
        }
        
        this.currentNoteData = { clientId, projectId, taskId, currentNote: decodedNote };
        const modal = document.getElementById('noteModal');
        const textarea = document.getElementById('noteModalText');
        const deleteBtn = document.getElementById('noteModalDeleteBtn');
        const managerNoteContainer = document.getElementById('managerNoteContainer');
        const managerNoteContent = document.getElementById('managerNoteContent');
        
        if (modal && textarea) {
            textarea.value = decodedNote || '';
            textarea.style.direction = 'rtl';
            
            // טעינת הערת המנהל אם קיימת
            try {
                const taskResponse = await fetch(`/api/get_task/${clientId}/${projectId}/${taskId}`);
                if (taskResponse.ok) {
                    const taskData = await taskResponse.json();
                    if (taskData.success && taskData.task && taskData.task.manager_note) {
                        if (managerNoteContainer && managerNoteContent) {
                            managerNoteContent.textContent = taskData.task.manager_note;
                            managerNoteContainer.style.display = 'block';
                        }
                    } else if (managerNoteContainer) {
                        managerNoteContainer.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Error loading manager note:', error);
                if (managerNoteContainer) {
                    managerNoteContainer.style.display = 'none';
                }
            }
            
            modal.style.display = 'flex';
            
            // Scroll to top of textarea
            textarea.scrollTop = 0;
            
            if (decodedNote && deleteBtn) {
                deleteBtn.style.display = 'inline-block';
            } else if (deleteBtn) {
                deleteBtn.style.display = 'none';
            }
            
            // Focus on textarea after modal appears
            setTimeout(() => textarea.focus(), 100);
        }
    },
    
    closeNoteModal: function() {
        const modal = document.getElementById('noteModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentNoteData = null;
    },
    
    saveNoteFromModal: async function() {
        if (!this.currentNoteData) return;
        
        const textarea = document.getElementById('noteModalText');
        if (!textarea) return;
        
        const note = textarea.value.trim();
        const { clientId, projectId, taskId } = this.currentNoteData;
        
        const loader = Loader.show();
        try {
            const result = await API.post(`/update_task/${clientId}/${projectId}/${taskId}`, {
                notes: note
            });
            
            Loader.hide(loader);
            
            if (result.ok && result.data && result.data.status === 'success') {
                this.closeNoteModal();
                // Reload page to show updated note in the row
                Toast.show('ההערה עודכנה בהצלחה', 'success');
                setTimeout(() => location.reload(), 300);
            } else {
                console.error('Save note failed:', result);
                const errorMsg = (result.data && result.data.error) || 'שגיאה בעדכון ההערה';
                Toast.show(errorMsg, 'error');
            }
        } catch (error) {
            Loader.hide(loader);
            Toast.show('שגיאה בהתקשרות לשרת', 'error');
            console.error('Save note error:', error);
        }
    },
    
    deleteNoteFromModal: async function() {
        if (!this.currentNoteData) return;
        if (!confirm('האם אתה בטוח שברצונך למחוק את ההערה?')) return;
        
        const { clientId, projectId, taskId } = this.currentNoteData;
        
        const loader = Loader.show();
        try {
            const result = await API.post(`/update_task/${clientId}/${projectId}/${taskId}`, {
                notes: ''
            });
            
            Loader.hide(loader);
            
            if (result.ok && result.data && result.data.status === 'success') {
                this.closeNoteModal();
                // Reload page to show updated note in the row
                Toast.show('ההערה נמחקה בהצלחה', 'success');
                setTimeout(() => location.reload(), 300);
            } else {
                console.error('Delete note failed:', result);
                const errorMsg = (result.data && result.data.error) || 'שגיאה במחיקת ההערה';
                Toast.show(errorMsg, 'error');
            }
        } catch (error) {
            Loader.hide(loader);
            Toast.show('שגיאה בהתקשרות לשרת', 'error');
            console.error('Delete note error:', error);
        }
    },
    
    currentNoteData: null
};

const ProjectManager = {
    add: async function(clientId, form) {
        const formData = new FormData(form);
        const title = formData.get('title');
        const is_shared = formData.get('is_shared') === 'true';
        
        if (!title) {
            Toast.show('אנא הזן שם פרויקט', 'error');
            return;
        }
        
        const loader = Loader.show(form.closest('.projects-section, .card, .main-content'));
        try {
            const result = await API.post(`/add_project/${clientId}`, { title, is_shared });
            
            Loader.hide(loader);
            
            console.log('Add project result:', result);
            
            if (result.ok && result.data && result.data.status === 'success') {
                const project = result.data.data.project;
                console.log('Project data:', project);
                const projectsSection = document.querySelector('.projects-section');
                
                if (!projectsSection) {
                    Toast.show('שגיאה: לא נמצא אזור פרויקטים', 'error');
                    return;
                }
                
                // Build project card HTML matching the template structure
                const projectTitle = project.title || 'פרויקט ללא שם';
                const projectNumber = project.project_number ? `<span style="color: #94a3b8; font-size: 0.75rem; font-weight: normal; margin-right: 8px; font-family: 'Heebo', monospace;">#${project.project_number}</span>` : '';
                const projectHtml = `
                    <div class="project-card-new collapsed" data-project-id="${project.id}" style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #e6e9ef;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div style="display: flex; align-items: center; gap: 12px; flex: 1;" class="project-header" onclick="toggleProject(this.closest('.project-card-new'))">
                                <h4 style="margin: 0; color: var(--primary); font-size: 1.2rem; display: flex; align-items: center;">
                                    <svg class="project-toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                    ${this.escapeHtml(projectTitle)}${projectNumber}
                                </h4>
                                <a href="/project/${clientId}/${project.id}/gantt" class="btn-black" style="padding: 6px 12px; font-size: 0.85rem; text-decoration: none; white-space: nowrap;" onclick="event.stopPropagation();">תרשים גאנט</a>
                            </div>
                            <button onclick="ProjectManager.delete('${clientId}', '${project.id}')" class="btn btn-danger btn-small" style="box-shadow: none; display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #e6e9ef; color: #043841;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#043841" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                מחק פרויקט
                            </button>
                        </div>
                        <div class="tasks-list" style="margin-bottom: 15px;">
                            <!-- Tasks will be added here -->
                        </div>
                        <form onsubmit="event.preventDefault(); TaskManager.add('${clientId}', '${project.id}', this);" class="add-task-form" style="background: white; padding: 15px; border-radius: 8px; border: 1px dashed #cbd5e1;">
                            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 12px; align-items: end;">
                                <div>
                                    <label style="display: block; margin-bottom: 6px; color: #64748b; font-size: 0.9rem; font-weight: bold;">שם המשימה:</label>
                                    <input type="text" name="title" placeholder="שם המשימה..." style="width: 100%; padding: 12px 14px; border: 2px solid #e6e9ef; border-radius: 8px;" required>
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 6px; color: #64748b; font-size: 0.9rem; font-weight: bold;">סטאטוס:</label>
                                    <select name="status" style="width: 100%; padding: 12px 14px; border: 2px solid #e6e9ef; border-radius: 8px;">
                                        <option value="לביצוע">📋 לביצוע</option>
                                        <option value="הועבר לסטודיו">🎨 הועבר לסטודיו</option>
                                        <option value="הועבר לדיגיטל">💻 הועבר לדיגיטל</option>
                                        <option value="נשלח ללקוח">📤 נשלח ללקוח</option>
                                        <option value="הושלם">✅ הושלם</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 6px; color: #64748b; font-size: 0.9rem; font-weight: bold;">הערה:</label>
                                    <input type="text" name="note" placeholder="הערה (אופציונלי)" style="width: 100%; padding: 12px 14px; border: 2px solid #e6e9ef; border-radius: 8px;">
                                </div>
                                <div>
                                    <button type="submit" class="btn-black" style="width: 100%; padding: 12px;">✨ הוסף משימה</button>
                                </div>
                            </div>
                        </form>
                    </div>
                `;
                
                // Insert after the header/form
                const headerForm = projectsSection.querySelector('form[onsubmit*="ProjectManager.add"]');
                if (headerForm && headerForm.parentElement) {
                    headerForm.parentElement.insertAdjacentHTML('afterend', projectHtml);
                } else {
                    const existingProjects = projectsSection.querySelectorAll('.project-card-new');
                    if (existingProjects.length > 0) {
                        existingProjects[existingProjects.length - 1].insertAdjacentHTML('afterend', projectHtml);
                    } else {
                        projectsSection.insertAdjacentHTML('beforeend', projectHtml);
                    }
                }
                
                form.reset();
                Toast.show('הפרויקט נוסף בהצלחה', 'success');
            } else {
                console.error('Add project failed:', result);
                const errorMsg = (result.data && result.data.error) || (result.data && result.data.message) || 'שגיאה בהוספת הפרויקט';
                Toast.show(errorMsg, 'error');
            }
        } catch (error) {
            Loader.hide(loader);
            Toast.show('שגיאה בהתקשרות לשרת', 'error');
            console.error('Add project error:', error);
        }
    },
    
    delete: async function(clientId, projectId) {
        if (!confirm('האם אתה בטוח שברצונך למחוק את הפרויקט? הפרויקט יישמר בארכיון.')) return;
        
        const loader = Loader.show();
        try {
            const result = await API.post(`/delete_project/${clientId}/${projectId}`, {});
            
            Loader.hide(loader);
            
            console.log('Delete project result:', result);
            
            if (result.ok && result.data && result.data.status === 'success') {
                Toast.show('הפרויקט נמחק ונשמר בארכיון', 'success');
                // טען את הדף מחדש
                setTimeout(() => location.reload(), 300);
            } else {
                console.error('Delete project failed:', result);
                const errorMsg = (result.data && result.data.error) || 'שגיאה במחיקת הפרויקט';
                Toast.show(errorMsg, 'error');
            }
        } catch (error) {
            Loader.hide(loader);
            Toast.show('שגיאה בהתקשרות לשרת', 'error');
            console.error('Delete project error:', error);
        }
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

const DocumentManager = {
    delete: async function(clientId, docId, buttonElement) {
        if (!confirm('האם אתה בטוח שברצונך למחוק את המסמך?')) return;
        
        const docElement = buttonElement.closest('div[style*="background"]');
        const loader = Loader.show(docElement);
        
        try {
            const result = await API.post(`/delete_document/${clientId}/${docId}`, {});
            
            Loader.hide(loader);
            
            if (result.ok && result.data.status === 'success') {
                if (docElement) {
                    docElement.style.transition = 'opacity 0.3s, transform 0.3s';
                    docElement.style.opacity = '0';
                    docElement.style.transform = 'translateX(-20px)';
                    setTimeout(() => docElement.remove(), 300);
                }
                Toast.show('המסמך נמחק בהצלחה', 'success');
            } else {
                Toast.show(result.data.error || 'שגיאה במחיקת המסמך', 'error');
            }
        } catch (error) {
            Loader.hide(loader);
            Toast.show('שגיאה בהתקשרות לשרת', 'error');
            console.error('Delete document error:', error);
        }
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside
    const modal = document.getElementById('noteModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                TaskManager.closeNoteModal();
            }
        });
    }
    
    // Add click handlers for note triggers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('note-trigger') || e.target.closest('.note-trigger')) {
            const trigger = e.target.classList.contains('note-trigger') ? e.target : e.target.closest('.note-trigger');
            if (trigger) {
                const clientId = trigger.getAttribute('data-client-id');
                const projectId = trigger.getAttribute('data-project-id');
                const taskId = trigger.getAttribute('data-task-id');
                const note = trigger.getAttribute('data-note') || '';
                TaskManager.showNoteModal(clientId, projectId, taskId, note);
            }
        }
    });
});
