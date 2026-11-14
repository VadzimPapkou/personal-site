import Image from "next/image";
import {
  formatExperience,
  formatPeriod,
  formatTotalExperience,
} from "@/lib/experience";
import type { Lang, Locale } from "@/lib/types";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Props = {
  lang: Lang;
  t: Locale;
};

export function ResumePage({ lang, t }: Props) {
  const totalExperience = formatTotalExperience(t.experience, lang);
  const resumeHref =
    lang === "en" ? "/vadim-popkov-en.pdf" : "/vadim-popkov-ru.pdf";
  const resumeFilename =
    lang === "en" ? "vadim-popkov-en.pdf" : "vadim-popkov-ru.pdf";
  const websiteLabel = t.website.replace(/^https?:\/\//, "");

  return (
    <div className="page">
      <main className="container-xl px-3 py-4">
        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-card Box">
              <div className="profile-card__top">
                <h1 className="profile-name">{t.name}</h1>
                <p className="profile-title text-muted">{t.title}</p>
              </div>

              <ul className="vcard-details">
                <li className="vcard-detail">
                  <Image
                    src="/location.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="vcard-icon"
                  />
                  <span>{t.location}</span>
                </li>
                <li className="vcard-detail">
                  <Image
                    src="/mail.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="vcard-icon"
                  />
                  <a href={`mailto:${t.email}`} className="Link--primary">
                    {t.email}
                  </a>
                </li>
                <li className="vcard-detail">
                  <Image
                    src="/phone.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="vcard-icon"
                  />
                  <a href={`tel:${t.phone}`} className="Link--primary">
                    {t.phone}
                  </a>
                </li>
                <li className="vcard-detail">
                  <Image
                    src="/telegram.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="vcard-icon"
                  />
                  <a
                    href={`https://t.me/${t.telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="Link--primary"
                  >
                    {`@${t.telegram}`}
                  </a>
                </li>
                <li className="vcard-detail">
                  <Image
                    src="/download.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="vcard-icon"
                  />
                  <a
                    href={t.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="Link--primary"
                  >
                    {websiteLabel}
                  </a>
                </li>
              </ul>
            </div>
            <div className="page-actions">
              <LanguageSwitcher lang={lang} t={t} />
              <a
                href={resumeHref}
                download={resumeFilename}
                className="resume-download"
                aria-label={t.resumeDownload}
                title={t.resumeDownload}
              >
                <Image
                  src="/download.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="resume-download__icon"
                />
              </a>
            </div>
          </aside>

          <div className="profile-main">
            <section className="Box mb-3">
              <div className="Box-header">
                <h2 className="Box-title">
                  {t.sections.experience}{" "}
                  <span className="Label Label--open experience__duration">
                    {totalExperience}
                  </span>
                </h2>
              </div>
              <div className="Box-body">
                {t.experience.map((item) => (
                  <article
                    key={`${item.company}-${item.startDate}`}
                    className="TimelineItem"
                    itemScope
                    itemType="https://schema.org/OrganizationRole"
                  >
                    <div className="TimelineItem-badge">
                      <span className="TimelineItem-badge-dot" />
                    </div>
                    <div className="TimelineItem-body">
                      <div className="experience__header">
                        <h3
                          className="experience__company"
                          itemProp="worksFor"
                          itemScope
                          itemType="https://schema.org/Organization"
                        >
                          <span itemProp="name">{item.company}</span>
                          <span className="Label Label--open experience__duration">
                            {formatExperience(
                              item.startDate,
                              item.endDate,
                              lang,
                            )}
                          </span>
                        </h3>
                        <p className="experience__position" itemProp="roleName">
                          {item.position}
                        </p>
                      </div>
                      <p className="experience__meta text-muted">
                        <span>
                          {formatPeriod(item.startDate, item.endDate, lang)}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{item.location}</span>
                      </p>
                      <p className="experience__description">
                        {item.description}
                      </p>
                      {item.subtitle ? (
                        <p className="experience__subtitle">{item.subtitle}</p>
                      ) : null}
                      {item.achievements?.length ? (
                        <ul className="experience__list">
                          {item.achievements.map((achievement) => (
                            <li
                              key={achievement.action}
                              className="experience__list-item"
                            >
                              <span className="experience__action">
                                {achievement.action}
                              </span>
                              {achievement.result ? (
                                <>
                                  {" "}
                                  <span
                                    className="experience__arrow"
                                    aria-hidden="true"
                                  >
                                    →
                                  </span>{" "}
                                  <span className="experience__result">
                                    {achievement.result}
                                  </span>
                                </>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="Box mb-3">
              <div className="Box-header">
                <h2 className="Box-title">{t.sections.skills}</h2>
              </div>
              <div className="Box-body">
                <div className="skills">
                  {t.skills.list.map((skill, index) => (
                    <span key={skill.name} className="skill-wrap">
                      {index > 0 ? (
                        <span className="skill__sep" aria-hidden="true">
                          ,{" "}
                        </span>
                      ) : null}
                      <span className="Label Label--secondary skill">
                        <Image
                          src={`/${skill.icon}`}
                          alt=""
                          width={16}
                          height={16}
                          className="skill__icon"
                        />
                        <span>{skill.name}</span>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="Box mb-3">
              <div className="Box-header">
                <h2 className="Box-title">{t.sections.education}</h2>
              </div>
              <div className="Box-body">
                <h3 className="education__university">
                  {t.education.university}
                </h3>
                <p className="education__degree">{t.education.degree}</p>
                <p className="text-muted">
                  {formatPeriod(
                    t.education.startDate,
                    t.education.endDate,
                    lang,
                  )}
                </p>
              </div>
            </section>

            <section className="Box mb-3">
              <div className="Box-header">
                <h2 className="Box-title">{t.sections.languages}</h2>
              </div>
              <div className="Box-body">
                <div className="languages">
                  <div className="language">
                    <span className="language__name">
                      {t.languages.russian}
                    </span>
                    <span className="text-muted">
                      {t.languages.russianLevel}
                    </span>
                  </div>
                  <div className="language">
                    <span className="language__name">
                      {t.languages.english}
                    </span>
                    <span className="text-muted">
                      {t.languages.englishLevel}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
