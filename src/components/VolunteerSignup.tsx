style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                    placeholder="(555) 123-4567"
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                  <ErrorMessage error={errors.phone} />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    <Calendar style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    <span>Date of Birth</span>
                  </label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => updateFormData('birth_date', e.target.value)}
                    style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#dcfce7', borderRadius: '0.5rem', padding: '0.75rem', marginRight: '1rem' }}>
                  <MapPin style={{ width: '2rem', height: '2rem', color: '#16a34a' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Location & Transportation</h2>
                  <p style={{ color: '#6b7280', margin: 0 }}>Help us find opportunities near you</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                    placeholder="123 Main Street"
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                  <ErrorMessage error={errors.address} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    ZIP Code *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      value={formData.zipcode}
                      onChange={(e) => updateFormData('zipcode', e.target.value)}
                      style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                      placeholder="12345"
                      maxLength={10}
                      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                    {zipLoading && (
                      <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                        <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite', color: '#2563eb' }} />
                      </div>
                    )}
                  </div>
                  <ErrorMessage error={errors.zipcode || zipError} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                      placeholder="City name"
                      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                    <ErrorMessage error={errors.city} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => updateFormData('state', e.target.value)}
                      style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                      placeholder="State"
                      maxLength={2}
                      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                    <ErrorMessage error={errors.state} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Maximum Travel Distance
                  </label>
                  <select
                    value={formData.max_distance}
                    onChange={(e) => updateFormData('max_distance', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none', backgroundColor: '#ffffff' }}
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  >
                    <option value={5}>Within 5 miles</option>
                    <option value={10}>Within 10 miles</option>
                    <option value={25}>Within 25 miles</option>
                    <option value={50}>Within 50 miles</option>
                    <option value={100}>Within 100 miles</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Transportation
                  </label>
                  <select
                    value={formData.transportation}
                    onChange={(e) => updateFormData('transportation', e.target.value)}
                    style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none', backgroundColor: '#ffffff' }}
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  >
                    <option value="own">Own Vehicle</option>
                    <option value="public">Public Transportation</option>
                    <option value="carpool">Willing to Carpool</option>
                    <option value="limited">Limited Transportation</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Skills & Interests */}
          {currentStep === 3 && (
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#f3e8ff', borderRadius: '0.5rem', padding: '0.75rem', marginRight: '1rem' }}>
                  <Heart style={{ width: '2rem', height: '2rem', color: '#9333ea' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Skills & Interests</h2>
                  <p style={{ color: '#6b7280', margin: 0 }}>Help us match you with the right opportunities</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '2rem' }}>
                <div>
                  <h3 style={{ fontWeight: 'bold', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                    <Award style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', color: '#2563eb' }} />
                    <span>Skills</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {skillsOptions.map((skill) => (
                      <label key={skill} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', transition: 'all 0.2s', backgroundColor: '#ffffff' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.backgroundColor = '#eff6ff'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#ffffff'; }}>
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          style={{ marginRight: '0.75rem', width: '1rem', height: '1rem', accentColor: '#2563eb' }}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontWeight: 'bold', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                    <Heart style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', color: '#dc2626' }} />
                    <span>Interests</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                    {interestsOptions.map((interest) => (
                      <label key={interest} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', transition: 'all 0.2s', backgroundColor: '#ffffff' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#d8b4fe'; e.currentTarget.style.backgroundColor = '#faf5ff'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#ffffff'; }}>
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                          style={{ marginRight: '0.75rem', width: '1rem', height: '1rem', accentColor: '#9333ea' }}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <Target style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', color: '#16a34a' }} />
                    <h3 style={{ fontWeight: 'bold', color: '#111827', margin: 0 }}>Preferred Categories</h3>
                    {categoriesLoading && <Loader2 style={{ width: '1rem', height: '1rem', marginLeft: '0.5rem', animation: 'spin 1s linear infinite', color: '#2563eb' }} />}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {categoriesLoading ? (
                      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <Loader2 style={{ width: '2rem', height: '2rem', animation: 'spin 1s linear infinite', color: '#2563eb', marginRight: '0.5rem' }} />
                        <span style={{ color: '#6b7280' }}>Loading categories...</span>
                      </div>
                    ) : (
                      volunteerCategories.map((category) => (
                        <label key={category.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', transition: 'all 0.2s', backgroundColor: '#ffffff' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#86efac'; e.currentTarget.style.backgroundColor = '#f0fdf4'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#ffffff'; }}>
                          <input
                            type="checkbox"
                            checked={formData.categories_interested.includes(category.category_name)}
                            onChange={() => handleCategoryToggle(category.category_name)}
                            style={{ marginRight: '0.75rem', width: '1rem', height: '1rem', accentColor: '#16a34a' }}
                          />
                          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{category.category_name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => updateFormData('experience_level', e.target.value)}
                    style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none', backgroundColor: '#ffffff' }}
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  >
                    <option value="beginner">🌱 Beginner - New to volunteering</option>
                    <option value="some">🌿 Some Experience - 1-2 years</option>
                    <option value="experienced">🌳 Experienced - 3+ years</option>
                    <option value="expert">🏆 Expert - Leadership experience</option>
                  </select>
                </div>

                <ErrorMessage error={errors.skills} />
              </div>
            </div>
          )}

          {/* Step 4: Availability */}
          {currentStep === 4 && (
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#dbeafe', borderRadius: '0.5rem', padding: '0.75rem', marginRight: '1rem' }}>
                  <Clock style={{ width: '2rem', height: '2rem', color: '#2563eb' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Availability</h2>
                  <p style={{ color: '#6b7280', margin: 0 }}>When are you available to volunteer?</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {Object.keys(formData.availability).map((day) => (
                  <div key={day} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem', textTransform: 'capitalize', color: '#111827', margin: 0 }}>{day}</h3>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.availability[day as keyof typeof formData.availability].available}
                          onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                          style={{ marginRight: '0.75rem', width: '1.25rem', height: '1.25rem', accentColor: '#2563eb' }}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Available</span>
                      </label>
                    </div>
                    
                    {formData.availability[day as keyof typeof formData.availability].available && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                        {timeSlots.map((timeSlot) => (
                          <label key={timeSlot} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', transition: 'all 0.2s', backgroundColor: '#ffffff' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.backgroundColor = '#eff6ff'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#ffffff'; }}>
                            <input
                              type="checkbox"
                              checked={formData.availability[day as keyof typeof formData.availability].times.includes(timeSlot)}
                              onChange={() => handleTimeSlotToggle(day, timeSlot)}
                              style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', accentColor: '#2563eb' }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{timeSlot}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <ErrorMessage error={errors.availability} />
              </div>
            </div>
          )}

          {/* Step 5: Emergency Contact & Consent */}
          {currentStep === 5 && (
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#fee2e2', borderRadius: '0.5rem', padding: '0.75rem', marginRight: '1rem' }}>
                  <Shield style={{ width: '2rem', height: '2rem', color: '#dc2626' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Emergency Contact & Consent</h2>
                  <p style={{ color: '#6b7280', margin: 0 }}>Final step - safety and preferences</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '1rem', display: 'flex', alignItems: 'center', margin: 0 }}>
                    <Shield style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                    <span>Emergency Contact Information</span>
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        Emergency Contact Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.emergency_contact_name}
                        onChange={(e) => updateFormData('emergency_contact_name', e.target.value)}
                        style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                        placeholder="Full name of emergency contact"
                        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                      />
                      <ErrorMessage error={errors.emergency_contact_name} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        Emergency Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.emergency_contact_phone}
                        onChange={(e) => updateFormData('emergency_contact_phone', e.target.value)}
                        style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                        placeholder="(555) 123-4567"
                        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                      />
                      <ErrorMessage error={errors.emergency_contact_phone} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        Relationship *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.emergency_contact_relationship}
                        onChange={(e) => updateFormData('emergency_contact_relationship', e.target.value)}
                        style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                        placeholder="e.g., Spouse, Parent, Sibling, Friend"
                        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                      />
                      <ErrorMessage error={errors.emergency_contact_relationship} />
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '1rem', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '1rem', margin: 0 }}>Consent & Preferences</h3>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.background_check_consent}
                        onChange={(e) => updateFormData('background_check_consent', e.target.checked)}
                        style={{ marginTop: '0.25rem', marginRight: '0.75rem', width: '1.25rem', height: '1.25rem', accentColor: '#2563eb' }}
                      />
                      <div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          📧 Send me email notifications about volunteer opportunities
                        </span>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>
                          We'll send you relevant opportunities and important updates
                        </p>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.sms_notifications}
                        onChange={(e) => updateFormData('sms_notifications', e.target.checked)}
                        style={{ marginTop: '0.25rem', marginRight: '0.75rem', width: '1.25rem', height: '1.25rem', accentColor: '#2563eb' }}
                      />
                      <div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          📱 Send me SMS notifications about urgent opportunities
                        </span>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>
                          Get text alerts for time-sensitive volunteer needs
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none', resize: 'none' }}
                    placeholder="Tell us anything else we should know about your volunteer interests, special accommodations needed, or other relevant information..."
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <ErrorMessage error={errors.submit} />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem 2rem', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.75rem',
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  fontWeight: '600',
                  cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentStep === 1 ? 0.5 : 1,
                  transition: 'all 0.2s',
                  fontSize: '0.875rem'
                }}
                onMouseEnter={e => {
                  if (currentStep !== 1) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={e => {
                  if (currentStep !== 1) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
              >
                <ArrowLeft style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                <span>Previous</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={autoSave}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem 1rem',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                    fontSize: '0.875rem'
                  }}
                  disabled={isAutoSaving}
                  onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
                >
                  {isAutoSaving ? (
                    <Loader2 style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  )}
                  <span>Save Progress</span>
                </button>

                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 2rem',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '0.875rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <span>Next</span>
                    <ArrowRight style={{ width: '1.25rem', height: '1.25rem', marginLeft: '0.5rem' }} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 2rem',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontWeight: '600',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.5 : 1,
                      transition: 'all 0.2s',
                      fontSize: '0.875rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={e => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = '#15803d';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = '#16a34a';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                        <span>Complete Registration</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add keyframe animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
};

export default VolunteerSignup;' }}
                      />
                      <div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          I consent to background checks as required by volunteer opportunities
                        </span>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>
                          Some opportunities may require background checks for safety reasons
                        </p>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.email_notifications}
                        onChange={(e) => updateFormData('email_notifications', e.target.checked)}
                        style={{ marginTop: '0.25rem', marginRight: '0.75rem', width: '1.25rem', height: '1.25rem', accentColor: '#2563eb// src/components/VolunteerSignup.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, MapPin, Heart, Clock, Shield, CheckCircle, ArrowRight, ArrowLeft, 
  Info, Calendar, Phone, Mail, AlertTriangle, Loader2,
  Star, Award, Users, Target, Save
} from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useZipLookup } from '../hooks/useZipLookup';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  skills: string[];
  interests: string[];
  categories_interested: string[];
  experience_level: string;
  availability: {
    monday: { available: boolean; times: string[] };
    tuesday: { available: boolean; times: string[] };
    wednesday: { available: boolean; times: string[] };
    thursday: { available: boolean; times: string[] };
    friday: { available: boolean; times: string[] };
    saturday: { available: boolean; times: string[] };
    sunday: { available: boolean; times: string[] };
  };
  max_distance: number;
  transportation: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  background_check_consent: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

const VolunteerSignup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load categories dynamically
  const { categories: volunteerCategories, loading: categoriesLoading } = useCategories('volunteer');
  
  // ZIP lookup hook
  const { data: zipData, loading: zipLoading, error: zipError, lookup: lookupZip } = useZipLookup();
  
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    skills: [],
    interests: [],
    categories_interested: [],
    experience_level: 'beginner',
    availability: {
      monday: { available: false, times: [] },
      tuesday: { available: false, times: [] },
      wednesday: { available: false, times: [] },
      thursday: { available: false, times: [] },
      friday: { available: false, times: [] },
      saturday: { available: false, times: [] },
      sunday: { available: false, times: [] }
    },
    max_distance: 25,
    transportation: 'own',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    background_check_consent: false,
    email_notifications: true,
    sms_notifications: false,
    notes: ''
  });

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (Object.values(formData).some(value => 
      typeof value === 'string' ? value.trim() !== '' : 
      Array.isArray(value) ? value.length > 0 : 
      false
    )) {
      setIsAutoSaving(true);
      try {
        localStorage.setItem('volunteer_signup_draft', JSON.stringify({
          formData,
          currentStep,
          timestamp: new Date().toISOString()
        }));
        setLastSaved(new Date());
      } catch (error) {
        console.warn('Auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }
  }, [formData, currentStep]);

  // Load saved draft on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('volunteer_signup_draft');
      if (saved) {
        const { formData: savedData, currentStep: savedStep, timestamp } = JSON.parse(saved);
        const saveTime = new Date(timestamp);
        const now = new Date();
        const hoursSinceLastSave = (now.getTime() - saveTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave < 24) {
          if (window.confirm('We found a saved draft from your previous session. Would you like to continue where you left off?')) {
            setFormData(savedData);
            setCurrentStep(savedStep);
            setLastSaved(saveTime);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load saved draft:', error);
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Handle ZIP code lookup
  useEffect(() => {
    if (formData.zipcode.length === 5) {
      lookupZip(formData.zipcode);
    }
  }, [formData.zipcode, lookupZip]);

  // Auto-fill city and state from ZIP lookup
  useEffect(() => {
    if (zipData && !zipError) {
      setFormData(prev => ({
        ...prev,
        city: zipData.city,
        state: zipData.state
      }));
    }
  }, [zipData, zipError]);

  const skillsOptions = [
    'Teaching', 'Tutoring', 'Administrative', 'Computer Skills', 'Social Media',
    'Marketing', 'Writing', 'Photography', 'Event Planning', 'Fundraising',
    'Construction', 'Gardening', 'Cooking', 'Cleaning', 'Driving',
    'Public Speaking', 'Translation', 'Medical Knowledge', 'Legal Knowledge',
    'Accounting', 'Music', 'Art', 'Sports Coaching', 'Childcare'
  ];

  const interestsOptions = [
    'Working with Children', 'Working with Seniors', 'Working with Animals',
    'Environmental Protection', 'Education', 'Healthcare', 'Arts & Culture',
    'Sports & Recreation', 'Community Development', 'Disaster Relief',
    'Homelessness', 'Food Security', 'Mental Health', 'Technology',
    'Faith-based Work', 'International Aid', 'Research', 'Advocacy'
  ];

  const timeSlots = [
    'Early Morning (6-9 AM)', 'Morning (9-12 PM)', 'Afternoon (12-5 PM)',
    'Evening (5-8 PM)', 'Night (8-11 PM)'
  ];

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateField = (field: keyof FormData, value: any): string | null => {
    switch (field) {
      case 'first_name':
      case 'last_name':
        return !value?.trim() ? 'This field is required' : null;
      case 'email':
        if (!value?.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : null;
      case 'phone':
        if (!value?.trim()) return 'Phone number is required';
        const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
        return !phoneRegex.test(value.replace(/\D/g, '')) ? 'Please enter a valid phone number' : null;
      case 'zipcode':
        if (!value?.trim()) return 'ZIP code is required';
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return !zipRegex.test(value) ? 'Please enter a valid ZIP code' : null;
      case 'address':
      case 'city':
      case 'state':
        return !value?.trim() ? 'This field is required' : null;
      case 'emergency_contact_name':
      case 'emergency_contact_phone':
      case 'emergency_contact_relationship':
        return !value?.trim() ? 'Emergency contact information is required' : null;
      default:
        return null;
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    switch (step) {
      case 1:
        ['first_name', 'last_name', 'email', 'phone'].forEach(field => {
          const error = validateField(field as keyof FormData, formData[field as keyof FormData]);
          if (error) {
            newErrors[field] = error;
            isValid = false;
          }
        });
        break;
      case 2:
        ['address', 'city', 'state', 'zipcode'].forEach(field => {
          const error = validateField(field as keyof FormData, formData[field as keyof FormData]);
          if (error) {
            newErrors[field] = error;
            isValid = false;
          }
        });
        break;
      case 3:
        if (formData.skills.length === 0 && formData.interests.length === 0 && formData.categories_interested.length === 0) {
          newErrors.skills = 'Please select at least one skill, interest, or category';
          isValid = false;
        }
        break;
      case 4:
        const hasAvailability = Object.values(formData.availability).some(day => day.available);
        if (!hasAvailability) {
          newErrors.availability = 'Please select at least one day when you\'re available';
          isValid = false;
        }
        break;
      case 5:
        ['emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'].forEach(field => {
          const error = validateField(field as keyof FormData, formData[field as keyof FormData]);
          if (error) {
            newErrors[field] = error;
            isValid = false;
          }
        });
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSkillToggle = (skill: string) => {
    const current = formData.skills;
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    updateFormData('skills', updated);
  };

  const handleInterestToggle = (interest: string) => {
    const current = formData.interests;
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    updateFormData('interests', updated);
  };

  const handleCategoryToggle = (category: string) => {
    const current = formData.categories_interested;
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    updateFormData('categories_interested', updated);
  };

  const handleAvailabilityChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value
        }
      }
    }));
  };

  const handleTimeSlotToggle = (day: string, timeSlot: string) => {
    const dayAvailability = formData.availability[day as keyof typeof formData.availability];
    const currentTimes = dayAvailability.times;
    const updated = currentTimes.includes(timeSlot)
      ? currentTimes.filter(t => t !== timeSlot)
      : [...currentTimes, timeSlot];
    
    handleAvailabilityChange(day, 'times', updated);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      autoSave();
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/volunteer-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setNearbyJobs(result.nearby_opportunities || []);
        setSubmitSuccess(true);
        localStorage.removeItem('volunteer_signup_draft');
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ErrorMessage = ({ error }: { error?: string | null }) => {
    if (!error) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.25rem', color: '#dc2626', fontSize: '0.875rem' }}>
        <AlertTriangle style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', flexShrink: 0 }} />
        <span>{error}</span>
      </div>
    );
  };

  const AutoSaveIndicator = () => {
    if (isAutoSaving) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#2563eb' }}>
          <Loader2 style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
          <span>Saving...</span>
        </div>
      );
    }
    
    if (lastSaved) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#16a34a' }}>
          <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          <span>Saved {lastSaved.toLocaleTimeString()}</span>
        </div>
      );
    }
    
    return null;
  };

  if (submitSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0fdf4 100%)', padding: '2rem' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e5e7eb', padding: '2rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <CheckCircle style={{ width: '4rem', height: '4rem', color: '#16a34a', margin: '0 auto 1rem', display: 'block' }} />
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>Welcome to our volunteer community!</h1>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Your registration was successful. We're excited to have you join us in making a difference.</p>
            </div>
            
            {nearbyJobs.length > 0 && (
              <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Opportunities near you:</h2>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                  {nearbyJobs.slice(0, 6).map((job: any, index: number) => (
                    <div key={index} style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #e5e7eb', transition: 'box-shadow 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ fontWeight: '500', color: '#111827', fontSize: '0.875rem' }}>{job.title}</h3>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{job.location}</p>
                          <p style={{ fontSize: '0.75rem', color: '#2563eb' }}>{job.category}</p>
                        </div>
                        {job.distance && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', backgroundColor: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '9999px' }}>
                            {job.distance} mi
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {job.volunteers_needed} volunteers needed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => window.location.href = '/job-board'}
                style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Browse All Opportunities
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{ backgroundColor: '#e5e7eb', color: '#374151', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d1d5db'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f3e8ff 100%)' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>
                Volunteer Registration
              </h1>
              <p style={{ color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>Join our community of changemakers</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ backgroundColor: '#dbeafe', borderRadius: '0.5rem', padding: '0.75rem', display: 'none' }}>
                <Award style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Step {currentStep} of 5</span>
            <AutoSaveIndicator />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((step) => (
              <React.Fragment key={step}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                  backgroundColor: step < currentStep ? '#16a34a' : step === currentStep ? '#2563eb' : '#e5e7eb',
                  color: step < currentStep || step === currentStep ? '#ffffff' : '#6b7280'
                }}>
                  {step < currentStep ? <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} /> : step}
                </div>
                {step < 5 && (
                  <div style={{
                    width: '4rem',
                    height: '0.5rem',
                    margin: '0 0.5rem',
                    borderRadius: '9999px',
                    transition: 'all 0.5s',
                    backgroundColor: step < currentStep ? '#16a34a' : '#e5e7eb'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: '0.5rem', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.5rem' }}>
            <div 
              style={{
                backgroundColor: '#2563eb',
                height: '0.5rem',
                borderRadius: '9999px',
                transition: 'all 0.5s ease-out',
                width: `${(currentStep / 5) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#dbeafe', borderRadius: '0.5rem', padding: '0.75rem', marginRight: '1rem' }}>
                  <User style={{ width: '2rem', height: '2rem', color: '#2563eb' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Personal Information</h2>
                  <p style={{ color: '#6b7280', margin: 0 }}>Tell us about yourself</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => updateFormData('first_name', e.target.value)}
                      style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                      placeholder="Enter your first name"
                      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                    <ErrorMessage error={errors.first_name} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => updateFormData('last_name', e.target.value)}
                      style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                      placeholder="Enter your last name"
                      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                    <ErrorMessage error={errors.last_name} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    <Mail style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    style={{ width: '100%', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', transition: 'all 0.2s', outline: 'none' }}
                    placeholder="your.email@example.com"
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                  <ErrorMessage error={errors.email} />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    <Phone style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    style={{ width: '100%', padding: '1rem', border: '